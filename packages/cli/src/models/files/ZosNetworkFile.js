import _ from 'lodash'
import Stdlib from '../stdlib/Stdlib'
import { Logger, FileSystem as fs } from 'zos-lib'
import { bytecodeDigest, bodyCode, constructorCode } from '../../utils/contracts'

const log = new Logger('ZosNetworkFile')

export default class ZosNetworkFile {

  constructor(packageFile, network, fileName) {
    this.packageFile = packageFile
    this.network = network
    this.fileName = fileName

    const defaults = this.packageFile.isLib ? { contracts: {}, lib: true, frozen: false } : { contracts: {}, instances: {} }
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
    return _.mapValues(this.instances, instances => _.filter(instances, 'upgradeable'))
  }

  get instances() {
    return this.data.instances || {}
  }

  get contracts() {
    return this.data.contracts || {}
  }

  get contractAliases() {
    return Object.keys(this.contracts)
  }

  get instanceAliases() {
    return Object.keys(this.instances)
  }

  get isLib() {
    return this.packageFile.isLib
  }

  proxiesList() {
    return _.flatMap(this.instanceAliases, alias => this.proxiesOf(alias).map(info => Object.assign(info, { alias })))
  }

  instance(alias, index) {
    return this.instancesOf(alias)[index]
  }

  instanceByAddress(alias, address) {
    const index = this.indexOfInstance(alias, address)
    return this.instancesOf(alias)[index]
  }

  instancesOf(alias) {
    return this.instances[alias] || []
  }

  proxiesOf(alias) {
    return this.instancesOf(alias).filter(instance => instance.upgradeable)
  }

  indexOfInstance(alias, address) {
    return this.instancesOf(alias).findIndex(instance => instance.address === address)
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

  hasInstances(alias = undefined) {
    return alias ? !_.isEmpty(this.instancesOf(alias)) : !_.isEmpty(this.instances)
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

  setInstances(alias, value) {
    this.data.instances[alias] = value
  }

  unsetContract(alias) {
    delete this.data.contracts[alias];
  }

  addInstance(alias, info) {
    if (!this.hasInstances(alias)) this.setInstances(alias, [])
    this.data.instances[alias].push(info)
  }

  setInstanceImplementation(alias, address, implementation) {
    const index = this.indexOfInstance(alias, address)
    if(index < 0) return
    this.data.instances[alias][index].implementation = implementation
  }

  removeInstance(alias, address) {
    const index = this.indexOfInstance(alias, address)
    if(index < 0) return
    this.data.instances[alias].splice(index, 1)
    if(this.instancesOf(alias).length === 0) delete this.data.instances[alias]
  }

  write() {
    fs.writeJson(this.fileName, this.data)
    log.info(`Successfully written ${this.fileName}`)
  }
}
