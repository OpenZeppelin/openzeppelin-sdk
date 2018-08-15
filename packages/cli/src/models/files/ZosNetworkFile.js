import _ from 'lodash'
import { Logger, FileSystem as fs } from 'zos-lib'
import { bytecodeDigest, bodyCode, constructorCode } from '../../utils/contracts'
import Stdlib from '../stdlib/Stdlib';
import { fromContractFullName, toContractFullName } from '../../utils/naming';

const log = new Logger('ZosNetworkFile')

export default class ZosNetworkFile {

  constructor(packageFile, network, fileName) {
    this.packageFile = packageFile
    this.network = network
    this.fileName = fileName

    const defaults = this.packageFile.isLib ? { contracts: {}, lib: true, frozen: false } : { contracts: {}, proxies: {} }
    defaults.zosversion = '2' // TODO: Implement auto upgrade
    this.data = fs.parseJsonIfExists(this.fileName) || defaults
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
    return _.isEmpty(this.getProxies(filter))
  }

  hasMatchingVersion() {
    return this.packageFile.isCurrentVersion(this.version)
  }

  hasCustomDeploy() {
    return this.hasStdlib() && this.stdlib.customDeploy
  }

  hasMatchingCustomDeploy() {
    return this.hasCustomDeploy() && this.packageFile.stdlibMatches(this.stdlib)
  }

  hasStdlib() {
    return !_.isEmpty(this.stdlib)
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

  set stdlib(stdlib) {
    this.data.stdlib = stdlib
  }

  set package(_package) {
    this.data.package = _package
  }

  setStdlibAddress(address) {
    const stdlib = this.stdlib || {}
    stdlib.address = address
    this.data.stdlib = stdlib
  }

  unsetStdlib() {
    delete this.data['stdlib']
  }

  addContract(alias, instance) {
    this.setContract(alias, {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      bytecodeHash: bytecodeDigest(instance.constructor.bytecode),
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

  removeContract(alias) {
    delete this.data.contracts[alias]
  }

  setProxies(packageName, alias, value) {
    const fullname = toContractFullName(packageName, alias)
    this.data.proxies[fullname] = value
  }

  unsetContract(alias) {
    delete this.data.contracts[alias];
  }

  addProxy(thepackage, alias, info) {
    const fullname = toContractFullName(thepackage, alias)
    if(!this.data.proxies[fullname]) this.data.proxies[fullname] = []
    this.data.proxies[fullname].push(info)
  }

  updateProxy(proxy) {
    const fullname = toContractFullName(proxy.package, proxy.contract)
    const existing = _.find(this.data.proxies[fullname], { address: proxy.address })
    Object.assign(existing, { 
      version: proxy.version,
      implementation: proxy.implementation
    })
  }

  write() {
    fs.writeJson(this.fileName, this.data)
    log.info(`Successfully written ${this.fileName}`)
  }
}
