import Logger from '../utils/Logger'

import ReleaseDeployer from './ReleaseDeployer'

const log = new Logger('Release')

export default class Release {

  static async deployLocal(contracts, txParams = {}) {
    const deployer = new ReleaseDeployer(txParams);
    return await deployer.deployLocal(contracts);
  }

  static async deployDependency(dependencyName, contracts, txParams = {}) {
    const deployer = new ReleaseDeployer(txParams);
    return await deployer.deployDependency(dependencyName, contracts);
  }

  constructor(release, txParams = {}) {
    this._release = release
    this.txParams = txParams
  }

  address() {
    return this._release.address
  }

  async owner() {
    return await this._release.owner(this.txParams)
  }

  async freeze() {
    log.info('Freezing release...')
    await this._release.freeze(this.txParams)
  }

  async isFrozen() {
    return await this._release.frozen(this.txParams)
  }

  async getImplementation(contractName) {
    return await this._release.getImplementation(contractName, this.txParams)
  }

  async setImplementation(contractName, implementationAddress) {
    log.info(`Setting ${contractName} implementation ${implementationAddress}`)
    return await this._release.setImplementation(contractName, implementationAddress, this.txParams)
  }

  async unsetImplementation(contractName) {
    log.info(`Unsetting ${contractName} implementation`)
    return await this._release.unsetImplementation(contractName, this.txParams)
  }
}
