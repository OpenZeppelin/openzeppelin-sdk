import _ from 'lodash'
import { Logger, FileSystem as fs, bytecodeDigest, bodyCode, constructorCode, semanticVersionToString } from 'zos-lib'
import { fromContractFullName, toContractFullName } from '../../utils/naming';
import { ZOS_VERSION, checkVersion } from './ZosVersion';

const log = new Logger('ZosNetworkFile')

export default class ZosNetworkFile {

  constructor(packageFile, network, fileName) {
    this.packageFile = packageFile
    this.network = network
    this.fileName = fileName

    const defaults = this.packageFile.isLib 
      ? { contracts: {}, lib: true, frozen: false, zosversion: ZOS_VERSION } 
      : { contracts: {}, proxies: {}, zosversion: ZOS_VERSION }
    
    this.data = fs.parseJsonIfExists(this.fileName) || defaults
    checkVersion(this.data.zosversion, this.fileName)
  }

  get app() {
    return this.data.app || {}
  }

  get appAddress() {
    return this.app.address
  }

  get package() {
    return this.data.package || {}
  }

  get packageAddress() {
    return this.package.address
  }

  get provider() {
    return this.data.provider || {}
  }

  get providerAddress() {
    return this.provider.address
  }

  get version() {
    return this.data.version
  }

  get frozen() {
    return this.data.frozen
  }

  get contracts() {
    return this.data.contracts || {}
  }

  get contractAliases() {
    return Object.keys(this.contracts)
  }
    
  get isLib() {
    return this.packageFile.isLib
  }

  get isLightweight() {
    return this.packageFile.isLightweight
  }

  get dependencies() {
    return this.data.dependencies || {}
  }

  get dependenciesNames() {
    return Object.keys(this.dependencies)
  }

  getDependency(name) {
    if (!this.data.dependencies) return null
    return this.data.dependencies[name] || {}
  }

  hasDependency(name) {
    return !_.isEmpty(this.getDependency(name))
  }

  hasDependencies() {
    return !_.isEmpty(this.dependencies)
  }

  getProxies({ package: packageName, contract, address } = {}) {
    if (_.isEmpty(this.data.proxies)) return []
    const allProxies = _.flatMap(this.data.proxies || {}, (proxiesList, fullname) => (
      _.map(proxiesList, proxyInfo => ({
        ...fromContractFullName(fullname),
        ...proxyInfo
      }))
    ))
    return _.filter(allProxies, proxy => (
      (!packageName || proxy.package === packageName) &&
      (!contract || proxy.contract === contract) &&
      (!address || proxy.address === address)
    ))
  }

  getProxy(address) {
    const allProxies = this.getProxies()
    return _.find(allProxies, { address })
  }

  contract(alias) {
    return this.data.contracts[alias]
  }

  contractAliasesMissingFromPackage() {
    return _.difference(this.contractAliases, this.packageFile.contractAliases)
  }

  isCurrentVersion(version) {
    return this.version === version
  }

  hasContract(alias) {
    return !_.isEmpty(this.contract(alias))
  }

  hasContracts() {
    return !_.isEmpty(this.data.contracts)
  }

  hasProxies(filter = {}) {
    return !_.isEmpty(this.getProxies(filter))
  }

  hasMatchingVersion() {
    return this.packageFile.isCurrentVersion(this.version)
  }

  dependenciesNamesMissingFromPackage() {
    return _.difference(this.dependenciesNames, this.packageFile.dependenciesNames)
  }

  dependencyHasCustomDeploy(name) {
    const dep = this.getDependency(name)
    return dep && dep.customDeploy
  }

  dependencySatisfiesVersionRequirement(name) {
    const dep = this.getDependency(name)
    return dep && this.packageFile.dependencyMatches(name, dep.version)
  }

  dependencyHasMatchingCustomDeploy(name) {
    return this.dependencyHasCustomDeploy(name) && this.dependencySatisfiesVersionRequirement(name)
  }

  hasSameBytecode(alias, klass) {
    const deployedBytecode = this.contract(alias).bytecodeHash
    const currentBytecode = bytecodeDigest(klass.bytecode)
    return currentBytecode === deployedBytecode
  }

  set version(version) {
    this.data.version = version
  }

  set contracts(contracts) {
    this.data.contracts = contracts
  }

  set frozen(frozen) {
    this.data.frozen = frozen
  }

  set app(app) {
    this.data.app = app
  }

  set provider(provider) {
    this.data.provider = provider
  }

  set package(_package) {
    this.data.package = _package
  }

  setDependency(name, { package: thepackage, version, customDeploy } = {}) {
    if (!this.data.dependencies) {
      this.data.dependencies = {}
    }
    
    const dependency = {
      package: thepackage,
      version: semanticVersionToString(version)
    }
    if (customDeploy) {
      dependency.customDeploy = customDeploy;
    }
    
    this.data.dependencies[name] = dependency
  }

  unsetDependency(name) {
    if (!this.data.dependencies) return
    delete this.data.dependencies[name]
  }

  updateDependency(name, fn) {
    this.setDependency(name, fn(this.getDependency(name)));
  }

  addContract(alias, instance, { types, storage } = {}) {
    this.setContract(alias, {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      bytecodeHash: bytecodeDigest(instance.constructor.bytecode),
      types,
      storage
    })
  }

  setContract(alias, value) {
    this.data.contracts[alias] = value
  }

  setContractAddress(alias, address) {
    this.data.contracts[alias].address = address
  }

  setContractBodyBytecodeHash(alias, bodyBytecodeHash) {
    this.data.contracts[alias].bodyBytecodeHash = bodyBytecodeHash
  }

  unsetContract(alias) {
    delete this.data.contracts[alias];
  }

  setProxies(packageName, alias, value) {
    const fullname = toContractFullName(packageName, alias)
    this.data.proxies[fullname] = value
  }


  addProxy(thepackage, alias, info) {
    const fullname = toContractFullName(thepackage, alias)
    if(!this.data.proxies[fullname]) this.data.proxies[fullname] = []
    this.data.proxies[fullname].push(info)
  }

  removeProxy(thepackage, alias, address) {
    const fullname = toContractFullName(thepackage, alias)
    const index = this._indexOfProxy(fullname, address)
    if(index < 0) return
    this.data.proxies[fullname].splice(index, 1)
    if(this._proxiesOf(fullname).length === 0) delete this.data.proxies[fullname]
  }

  updateProxy({ package: proxyPackageName, contract: proxyContractName, address: proxyAddress }, fn) {
    const fullname = toContractFullName(proxyPackageName, proxyContractName)
    const index = this._indexOfProxy(fullname, proxyAddress)
    if (index === -1) throw Error(`Proxy ${fullname} at ${proxyAddress} not found in network file`)
    this.data.proxies[fullname][index] = fn(this.data.proxies[fullname][index]);
  }

  _indexOfProxy(fullname, address) {
    return _.findIndex(this.data.proxies[fullname], { address })
  }

  _proxiesOf(fullname) {
    return this.data.proxies[fullname] || []
  }

  write() {
    fs.writeJson(this.fileName, this.data)
    log.info(`Successfully written ${this.fileName}`)
  }
}
