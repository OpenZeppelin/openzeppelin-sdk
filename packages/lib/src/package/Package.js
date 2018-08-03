import Logger from '../utils/Logger'
import { deploy, sendTransaction } from '../utils/Transactions'

import PackageProvider from './PackageProvider'
import PackageDeployer from './PackageDeployer'

const log = new Logger('Package')

export default class Package {

  static fetch(address, txParams = {}, klass = require('./PackageWithAppDirectories')) {
    const provider = new PackageProvider(txParams)
    return provider.fetch(address, klass.default)
  }

  static async deploy(txParams = {}, klass = require('./PackageWithAppDirectories')) {
    const deployer = new PackageDeployer(txParams)
    return deployer.deploy(klass.default)
  }

  static async deployWithFreezableDirectories(txParams = {}) {
    return this.deploy(txParams, require('./PackageWithFreezableDirectories'))
  }

  static fetchWithFreezableDirectories(address, txParams = {}) {
    return this.fetch(address, txParams, require('./PackageWithFreezableDirectories'))
  }

  static async deployWithNonFreezableDirectories(txParams = {}) {
    return this.deploy(txParams, require('./PackageWithNonFreezableDirectories'))
  }

  static fetchWithNonFreezableDirectories(address, txParams = {}) {
    return this.fetch(address, txParams, require('./PackageWithNonFreezableDirectories'))
  }

  constructor(_package, txParams = {}) {
    this.package = _package
    this.txParams = txParams
  }

  get address() {
    return this.package.address
  }

  async hasVersion(version) {
    return sendTransaction(this.package.hasVersion, [version], this.txParams)
  }

  async getImplementation(version, contractName) {
    return this.package.getImplementation(version, contractName)
  }

  async setImplementation(version, contractClass, contractName) {
    log.info(`Setting implementation of ${contractName} in version ${version}...`)
    const implementation = await deploy(contractClass, [], this.txParams)
    const directory = await this.getDirectory(version)
    await directory.setImplementation(contractName, implementation.address)
    return implementation
  }

  async unsetImplementation (version, contractName) {
    log.info(`Unsetting implementation of ${contractName} in version ${version}...`)
    const directory = await this.getDirectory(version)
    await directory.unsetImplementation(contractName, this.txParams)
  }

  async newVersion(version, stdlibAddress) {
    log.info('Adding new version...')
    const directory = await this.newDirectory(stdlibAddress)
    await sendTransaction(this.package.addVersion, [version, directory.address], this.txParams)
    log.info(`Added version ${version}`)
    return directory
  }

  async getDirectory(version) {
    const directoryAddress = await this.package.getVersion(version)
    return this.wrapImplementationDirectory(directoryAddress)
  }

  wrapImplementationDirectory() {
    throw Error('Cannot call abstract method wrapImplementationDirectory()')
  }

  async newDirectory() {
    throw Error('Cannot call abstract method newDirectory()')
  }
}
