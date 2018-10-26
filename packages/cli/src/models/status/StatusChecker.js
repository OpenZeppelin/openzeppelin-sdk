import _ from 'lodash'
import { promisify } from 'util'

import { Logger, LibProject, AppProject, bytecodeDigest, semanticVersionEqual, replaceSolidityLibAddress, isSolidityLib } from 'zos-lib'
import EventsFilter from './EventsFilter'
import StatusFetcher from './StatusFetcher'
import StatusComparator from './StatusComparator'

const log = new Logger('StatusChecker')
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default class StatusChecker {

  static fetch(networkFile, txParams = {}) {
    const fetcher = new StatusFetcher(networkFile)
    return new this(fetcher, networkFile, txParams)
  }

  static compare(networkFile, txParams = {}) {
    const comparator = new StatusComparator()
    return new this(comparator, networkFile, txParams)
  }

  constructor(visitor, networkFile, txParams = {}) {
    this.visitor = visitor
    this.txParams = txParams
    this.networkFile = networkFile
    this.packageName = this.networkFile.packageFile.name
  }

  async setProject() {
    try {
      const { packageAddress, appAddress, version } = this.networkFile

      if (!this._project) {
        this._project = this.networkFile.isLib
          ? await LibProject.fetchOrDeploy(this.networkFile.version, this.txParams, { packageAddress })
          : await AppProject.fetchOrDeploy(this.packageName,  this.networkFile.version, this.txParams, { appAddress, packageAddress })
      }

      return this._project
    } catch(error) {
      throw Error(`Cannot fetch project contract from address ${this.networkFile.appAddress}.`, error)
    }
  }

  async call() {
    await this.setProject()
    log.info(`Comparing status of project ${(await this._project.getProjectPackage()).address} ...\n`)
    if (this.networkFile.isLib) {
      await this.checkLib()
    } else {
      await this.checkApp()
    }
    this.visitor.onEndChecking()
  }

  async checkApp() {
    await this.checkVersion()
    await this.checkPackage()
    await this.checkProvider()
    await this.checkImplementations()
    await this.checkProxies()
    await this.checkDependencies()
  }

  async checkLib() {
    await this.checkProvider()
    await this.checkImplementations()
  }

  async checkVersion() {
    const observed = this._project.version
    const expected = this.networkFile.version
    if(!semanticVersionEqual(observed, expected)) this.visitor.onMismatchingVersion(expected, observed)
  }

  async checkPackage() {
    const observed = this._project.package.address
    const expected = this.networkFile.packageAddress
    if(observed !== expected) this.visitor.onMismatchingPackage(expected, observed)
  }

  async checkProvider() {
    const currentDirectory = await this._project.getCurrentDirectory()
    const observed = currentDirectory.address
    const expected = this.networkFile.providerAddress
    if(observed !== expected) this.visitor.onMismatchingProvider(expected, observed)
  }

  async checkDependencies() {
    const dependenciesInfo = await this._fetchOnChainPackages()
    dependenciesInfo.forEach(info => this._checkRemoteDependency(info))
    this._checkUnregisteredLocalDependencies(dependenciesInfo)
  }

  async checkImplementations() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    await Promise.all(
      implementationsInfo.map(async info => {
        const { address } = info;
        const bytecode = await promisify(web3.eth.getCode.bind(web3.eth))(address);
        return await (isSolidityLib(bytecode) 
          ? this._checkRemoteSolidityLibImplementation(info, bytecode) 
          : this._checkRemoteContractImplementation(info, bytecode));
      })
    )
    this._checkUnregisteredLocalImplementations(implementationsInfo)
  }

  async checkProxies() {
    const proxiesInfo = await this._fetchOnChainProxies()
    proxiesInfo.forEach(info => this._checkRemoteProxy(info))
    this._checkUnregisteredLocalProxies(proxiesInfo)
  }

  async _checkRemoteContractImplementation({ alias, address }, bytecode) {
    if (this.networkFile.hasContract(alias)) {
      this._checkContractImplementationAddress(alias, address)
      this._checkContractImplementationBytecode(alias, address, bytecode)
    }
    else {
      await this.visitor.onMissingRemoteImplementation('none', 'one', { alias, address })
    }
  }

  _checkContractImplementationAddress(alias, address) {
    const expected = this.networkFile.contract(alias).address
    if (address !== expected) this.visitor.onMismatchingImplementationAddress(expected, address, { alias, address })
  }

  _checkContractImplementationBytecode(alias, address, bytecode) {
    const expected = this.networkFile.contract(alias).bodyBytecodeHash
    const observed = bytecodeDigest(bytecode)
    if (observed !== expected) this.visitor.onMismatchingImplementationBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash: observed })
  }

  async _checkRemoteSolidityLibImplementation({ alias, address }, bytecode) {
    if (this.networkFile.hasSolidityLib(alias)) {
      this._checkSolidityLibImplementationAddress(alias, address)
      this._checkSolidityLibImplementationBytecode(alias, address, bytecode)
    }
    //TODO: implement missing remote solidity libs validation
    //else this.visitor.onMissingRemoteImplementation('none', 'one', { alias, address })
  }

  _checkSolidityLibImplementationAddress(alias, address) {
    const expected = this.networkFile.solidityLib(alias).address
    if (address !== expected) this.visitor.onMismatchingImplementationAddress(expected, address, { alias, address })
  }

  _checkSolidityLibImplementationBytecode(alias, address, bytecode) {
    const expected = this.networkFile.solidityLib(alias).bodyBytecodeHash
    const observed = bytecodeDigest(replaceSolidityLibAddress(bytecode, address))
    if (observed !== expected) this.visitor.onMismatchingImplementationBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash: observed })
  }

  _checkUnregisteredLocalImplementations(implementationsInfo) {
    const foundAliases = implementationsInfo.map(info => info.alias)
    this.networkFile.contractAliases
      .filter(alias => !foundAliases.includes(alias))
      .forEach(alias => {
        const { address } = this.networkFile.contract(alias)
        this.visitor.onUnregisteredLocalImplementation('one', 'none', { alias, address })
      })
  }

  _checkRemoteProxy(remoteProxyInfo) {
    const localProxyInfo = this.networkFile.getProxy(remoteProxyInfo.address)
    if (localProxyInfo) {
      this._checkProxyAlias(localProxyInfo, remoteProxyInfo)
      this._checkProxyImplementation(localProxyInfo, remoteProxyInfo)
    } else {
      this.visitor.onMissingRemoteProxy('none', 'one', { ...remoteProxyInfo, packageName: this.packageName })
    }
  }

  _checkProxyAlias(localProxyInfo, remoteProxyInfo) {
    const { alias: observed } = remoteProxyInfo
    const { contract: expected, version, package: packageName } = localProxyInfo
    if (observed !== expected) this.visitor.onMismatchingProxyAlias(expected, observed, { packageName, version, ...remoteProxyInfo })
  }

  _checkProxyImplementation(localProxyInfo, remoteProxyInfo) {
    const { implementation: observed } = remoteProxyInfo
    const { implementation: expected, version, package: packageName } = localProxyInfo
    if (observed !== expected) this.visitor.onMismatchingProxyImplementation(expected, observed, { packageName, version, ...remoteProxyInfo })
  }

  _checkUnregisteredLocalProxies(proxiesInfo) {
    const foundAddresses = proxiesInfo.map(info => info.address)
    this.networkFile.getProxies()
      .filter(proxy => !foundAddresses.includes(proxy.address))
      .forEach(proxy => {
        const { contract: alias, package: packageName, address, implementation } = proxy
        this.visitor.onUnregisteredLocalProxy('one', 'none', { packageName, alias, address, implementation })
      })
  }

  _checkRemoteDependency({ name, version, package: address }) {
    if (this.networkFile.hasDependency(name)) {
      this._checkDependencyAddress(name, address)
      this._checkDependencyVersion(name, version)
    }
    else this.visitor.onMissingDependency('none', 'one', { name, address, version })
  }

  _checkDependencyAddress(name, address) {
    const expected = this.networkFile.getDependency(name).package
    if (address !== expected) this.visitor.onMismatchingDependencyAddress(expected, address, { name, address })
  }

  _checkDependencyVersion(name, version) {
    const expected = this.networkFile.getDependency(name).version
    if (!semanticVersionEqual(version, expected)) this.visitor.onMismatchingDependencyVersion(expected, version, { name, version })
  }

  _checkUnregisteredLocalDependencies(dependenciesInfo) {
    const foundDependencies = dependenciesInfo.map(dependency => dependency.name)
    this.networkFile.dependenciesNames
      .filter(name => !foundDependencies.includes(name))
      .forEach(name => {
        const dependency = this.networkFile.getDependency(name)
        this.visitor.onUnregisteredDependency('one', 'none', { ...dependency, name })
      })
  }

  async _fetchOnChainImplementations() {
    const filter = new EventsFilter()
    const directory = await this._project.getCurrentDirectory()
    const allEvents = await filter.call(directory.contract, 'ImplementationChanged')
    const contractsAlias = allEvents.map(event => event.args.contractName)
    const events = allEvents
      .filter((event, index) => contractsAlias.lastIndexOf(event.args.contractName) === index)
      .filter(event => event.args.implementation !== ZERO_ADDRESS)
      .map(event => ({ alias: event.args.contractName, address: event.args.implementation }))

    return events;
  }

  async _fetchOnChainProxies() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    const filter = new EventsFilter()
    const app = this._project.getApp()
    const proxyEvents = await filter.call(app.appContract, 'ProxyCreated')
    const proxiesInfo = []
    await Promise.all(proxyEvents.map(async event => {
      const address = event.args.proxy
      const implementation = await app.getProxyImplementation(address)
      const matchingImplementations = implementationsInfo.filter(info => info.address === implementation)
      if (matchingImplementations.length > 1) {
        this.visitor.onMultipleProxyImplementations('one', matchingImplementations.length, { implementation })
      } else if (matchingImplementations.length === 0) {
        this.visitor.onUnregisteredProxyImplementation('one', 'none', { address, implementation })
      } else {
        const alias = matchingImplementations[0].alias
        proxiesInfo.push({ alias, implementation, address })
      }
    }))
    return proxiesInfo
  }

  async _fetchOnChainPackages() {
    const filter = new EventsFilter()
    const app = this._project.getApp()
    const allEvents = await filter.call(app.appContract, 'PackageChanged')
    const filteredEvents = allEvents
      .filter(event => event.args.package !== ZERO_ADDRESS)
      .filter(event => event.args.providerName !== this.packageName)
      .map(event => ({
        name: event.args.providerName,
        version: event.args.version,
        package: event.args.package
      }))
      .reduce((dependencies, dependency) => {
        dependencies[dependency.name] = dependency
        return dependencies
      }, {})

      return Object.values(filteredEvents)
  }
}
