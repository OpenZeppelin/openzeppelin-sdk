import { Logger, App } from 'zos-lib'
import EventsFilter from './EventsFilter'
import StatusFetcher from './StatusFetcher'
import StatusComparator from './StatusComparator'
import { bytecodeDigest } from '../../utils/contracts'
import PackageAtVersion from '../lib/PackageAtVersion';

const log = new Logger('StatusChecker')
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default class StatusChecker {

  static fetch(networkFile, txParams = {}) {
    const fetcher = new StatusFetcher(networkFile)
    return new StatusChecker(fetcher, networkFile, txParams)
  }

  static compare(networkFile, txParams = {}) {
    const comparator = new StatusComparator()
    return new StatusChecker(comparator, networkFile, txParams)
  }

  constructor(visitor, networkFile, txParams = {}) {
    this.visitor = visitor
    this.txParams = txParams
    this.networkFile = networkFile
  }

  async app() {
    try {
      if (!this._app) {
        this._app = this.networkFile.isLib 
          ? await PackageAtVersion.fetch(this.networkFile.packageAddress, this.networkFile.version, this.txParams)
          : await App.fetch(this.networkFile.appAddress, this.txParams)
      }
      return this._app
    } catch(error) {
      throw Error(`Cannot fetch project contract from address ${this.networkFile.appAddress}.`, error)
    }
  }

  async call() {
    log.info(`Comparing status of project ${(await this.app()).address()}...\n`)
    if (this.networkFile.isLib) {
      await this.checkLib();
    } else {
      await this.checkApp();
    }
    this.visitor.onEndChecking()
  }

  async checkApp() {
    await this.checkVersion()
    await this.checkPackage()
    await this.checkProvider()
    await this.checkStdlib()
    await this.checkImplementations()
    await this.checkProxies()
  }

  async checkLib() {
    await this.checkProvider()
    await this.checkImplementations()
  }

  async checkVersion() {
    const observed = (await this.app()).version
    const expected = this.networkFile.version
    if(observed !== expected) this.visitor.onMismatchingVersion(expected, observed)
  }

  async checkPackage() {
    const observed = (await this.app()).package.address
    const expected = this.networkFile.packageAddress
    if(observed !== expected) this.visitor.onMismatchingPackage(expected, observed)
  }

  async checkProvider() {
    const observed = (await this.app()).currentDirectory().address
    const expected = this.networkFile.providerAddress
    if(observed !== expected) this.visitor.onMismatchingProvider(expected, observed)
  }

  async checkStdlib() {
    const app = await this.app();
    const currentStdlib = await app.currentStdlib();
    const observed = currentStdlib === ZERO_ADDRESS ? 'none' : currentStdlib
    const expected = this.networkFile.stdlibAddress || 'none'
    if(observed !== expected) this.visitor.onMismatchingStdlib(expected, observed)
  }

  async checkImplementations() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    implementationsInfo.forEach(info => this._checkRemoteImplementation(info))
    this._checkUnregisteredLocalImplementations(implementationsInfo)
  }

  async checkProxies() {
    const proxiesInfo = await this._fetchOnChainProxies()
    proxiesInfo.forEach(info => this._checkRemoteProxy(info))
    this._checkUnregisteredLocalProxies(proxiesInfo)
  }

  _checkRemoteImplementation({ alias, address }) {
    if (this.networkFile.hasContract(alias)) {
      this._checkImplementationAddress(alias, address)
      this._checkImplementationBytecode(alias, address)
    }
    else this.visitor.onMissingRemoteContract('none', 'one', { alias, address })
  }

  _checkImplementationAddress(alias, address) {
    const expected = this.networkFile.contract(alias).address
    if (address !== expected) this.visitor.onMismatchingContractAddress(expected, address, { alias, address })
  }

  _checkImplementationBytecode(alias, address) {
    const expected = this.networkFile.contract(alias).bodyBytecodeHash
    const observed = bytecodeDigest(web3.eth.getCode(address))
    if (observed !== expected) this.visitor.onMismatchingContractBodyBytecode(expected, observed, { alias, address, bodyBytecodeHash: observed })
  }

  _checkUnregisteredLocalImplementations(implementationsInfo) {
    const foundAliases = implementationsInfo.map(info => info.alias)
    this.networkFile.contractAliases
      .filter(alias => !foundAliases.includes(alias))
      .forEach(alias => {
        const { address } = this.networkFile.contract(alias)
        this.visitor.onUnregisteredLocalContract('one', 'none', { alias, address })
      })
  }

  _checkRemoteProxy({ alias, address, implementation}) {
    const matchingProxy = this.networkFile.proxiesList().find(proxy => proxy.address === address)
    if (matchingProxy) {
      this._checkProxyAlias(matchingProxy, alias, address, implementation)
      this._checkProxyImplementation(matchingProxy, alias, address, implementation)
    }
    else this.visitor.onMissingRemoteProxy('none', 'one', { alias, address, implementation })
  }

  _checkProxyAlias(proxy, alias, address, implementation) {
    const expected = proxy.alias
    if (alias !== expected) this.visitor.onMismatchingProxyAlias(expected, alias, { alias, address, implementation })
  }

  _checkProxyImplementation(proxy, alias, address, implementation) {
    const expected = proxy.implementation
    if (implementation !== expected) this.visitor.onMismatchingProxyImplementation(expected, implementation, { alias, address, implementation })
  }

  _checkUnregisteredLocalProxies(proxiesInfo) {
    const foundAddresses = proxiesInfo.map(info => info.address)
    this.networkFile.proxiesList()
      .filter(proxy => !foundAddresses.includes(proxy.address))
      .forEach(proxy => {
        const { alias, address, implementation } = proxy
        this.visitor.onUnregisteredLocalProxy('one', 'none', { alias, address, implementation })
      })
  }

  async _fetchOnChainImplementations() {
    const app = await this.app();
    const filter = new EventsFilter();
    const allEvents = await filter.call(app.currentDirectory(), 'ImplementationChanged')
    const contractsAlias = allEvents.map(event => event.args.contractName)
    return allEvents
      .filter((event, index) => contractsAlias.lastIndexOf(event.args.contractName) === index)
      .filter(event => event.args.implementation !== ZERO_ADDRESS)
      .map(event => ({ alias: event.args.contractName, address: event.args.implementation }))
  }

  async _fetchOnChainProxies() {
    const implementationsInfo = await this._fetchOnChainImplementations()
    const app = await this.app();
    const filter = new EventsFilter()
    const proxyEvents = await filter.call(app.factory, 'ProxyCreated')
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
    return proxiesInfo;
  }
}
