import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'

import PackageDeployer from './PackageDeployer'
import PackageProvider from './PackageProvider'

const log = new Logger('Package')

export default class Package {

  static async fetch(address, txParams = {}) {
    const provider = new PackageProvider(txParams)
    return await provider.from(address)
  }

  static async deploy(txParams = {}) {
    const deployer = new PackageDeployer(txParams)
    return await deployer.deploy()
  }

  constructor(_package, txParams = {}) {
    this.package = _package
    this.txParams = txParams
  }

  address() {
    return this.package.address
  }

  async hasVersion(version) {
    return await this.package.hasVersion(version, this.txParams)
  }

  async getRelease(version) {
    const releaseAddress = await this.package.getVersion(version)
    const Release = Contracts.getFromLib('Release')
    return new Release(releaseAddress)
  }

  async newVersion(version) {
    log.info('Adding new version...')
    const Release = Contracts.getFromLib('Release')
    const release = await Release.new(this.txParams)
    await this.package.addVersion(version, release.address, this.txParams)
    log.info(' Added version:', version)
    return release
  }

  async isFrozen(version) {
    const release = await this.getRelease(version)
    return await release.frozen()
  }

  async freeze(version) {
    log.info('Freezing new version...')
    const release = await this.getRelease(version)
    await release.freeze(this.txParams)
    log.info(' Release frozen')
  }

  async getImplementation(version, contractName) {
    const release = await this.getRelease(version)
    return await release.getImplementation(contractName)
  }

  async setImplementation(version, contractClass, contractName) {
    log.info(`Setting implementation of ${contractName} in version ${version}...`)
    const implementation = await contractClass.new(this.txParams)
    const release = await this.getRelease(version)
    await release.setImplementation(contractName, implementation.address, this.txParams)
    log.info(` Implementation set: ${implementation.address}`)
    return implementation
  }

  async unsetImplementation (version, contractName) {
    log.info(`Unsetting implementation of ${contractName} in version ${version}...`)
    const release = await this.getRelease(version)
    await release.unsetImplementation(contractName, this.txParams)
    log.info(`Implementation unset for ${contractName} in version ${version}`)
  };
}
