import _ from 'lodash'
import { Logger, FileSystem as fs } from 'zos-lib'
import { bytecodeDigest, bodyCode, constructorCode } from '../../utils/contracts'

const log = new Logger('ZosNetworkFile')

export default class ZosNetworkFile {

  constructor(packageFile, network, fileName) {
    this.packageFile = packageFile
    this.network = network
    this.fileName = fileName

    const defaults = this.packageFile.isLib ? { contracts: {}, lib: true, frozen: false } : { contracts: {}, proxies: {} }
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

  get stdlib() {
    return this.data.stdlib || {}
  }

  get stdlibName() {
    return this.stdlib.name
  }

  get stdlibVersion() {
    return this.stdlib.version
  }

  get stdlibAddress() {
    return this.stdlib.address
  }

  get proxies() {
    return this.data.proxies || {}
  }

  get contracts() {
    return this.data.contracts || {}
  }

  get contractAliases() {
    return Object.keys(this.contracts)
  }

  get proxyAliases() {
    return Object.keys(this.proxies)
  }

  get isLib() {
    return this.packageFile.isLib
  }

  proxiesList() {
    return this.proxyAliases.flatMap(alias => this.proxiesOf(alias).map(info => {
      info['alias'] = alias
      return info
    }))
  }

  proxy(alias, index) {
    return this.proxiesOf(alias)[index]
  }

  proxyByAddress(alias, address) {
    const index = this.indexOfProxy(alias, address)
    return this.proxiesOf(alias)[index]
  }

  proxiesOf(alias) {
    return this.proxies[alias] || []
  }

  indexOfProxy(alias, address) {
    return this.proxiesOf(alias).findIndex(proxy => proxy.address === address)
  }

  contract(alias) {
    return this.contracts[alias]
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
    return !_.isEmpty(this.contracts)
  }

  hasProxies(alias = undefined) {
    return alias ? !_.isEmpty(this.proxiesOf(alias)) : !_.isEmpty(this.proxies)
  }

  hasMatchingVersion() {
    return this.packageFile.isCurrentVersion(this.version)
  }

  hasCustomDeploy() {
    return this.hasStdlib() && this.stdlib.customDeploy
  }

  hasMatchingCustomDeploy() {
    return this.hasCustomDeploy() && this.packageFile.hasStdlib(this.stdlib)
  }

  hasStdlib(stdlib = undefined) {
    if(stdlib === undefined) return !_.isEmpty(this.stdlib)
    return this.stdlib.name === stdlib.name && this.stdlib.version === stdlib.version
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

  setProxies(alias, value) {
    this.data.proxies[alias] = value
  }

  unsetContract(alias) {
    delete this.data.contracts[alias];
  }

  addProxy(alias, info) {
    if (!this.hasProxies(alias)) this.setProxies(alias, [])
    this.data.proxies[alias].push(info)
  }

  setProxyImplementation(alias, address, implementation) {
    const index = this.indexOfProxy(alias, address)
    if(index < 0) return
    this.data.proxies[alias][index].implementation = implementation
  }

  removeProxy(alias, address) {
    const index = this.indexOfProxy(alias, address)
    if(index < 0) return
    this.data.proxies[alias].splice(index, 1)
    if(this.proxiesOf(alias).length === 0) delete this.data.proxies[alias]
  }

  write() {
    fs.writeJson(this.fileName, this.data)
    log.info(`Successfully written ${this.fileName}`)
  }
}
