import Logger from '../utils/Logger'

import ReleaseDeployer from './ReleaseDeployer'
import { sendTransaction } from '../utils/Transactions';

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
    return await this._release.owner()
  }

  async freeze() {
    log.info('Freezing release...')
    await sendTransaction(this._release.freeze, [], this.txParams)
  }

  async isFrozen() {
    return await this._release.frozen()
  }

  async getImplementation(contractName) {
    return await this._release.getImplementation(contractName)
  }

  async setImplementation(contractName, implementationAddress) {
    log.info(`Setting ${contractName} implementation ${implementationAddress}`)
    return await sendTransaction(this._release.setImplementation, [contractName, implementationAddress], this.txParams)
  }

  async unsetImplementation(contractName) {
    log.info(`Unsetting ${contractName} implementation`)
    return await sendTransaction(this._release.unsetImplementation, [contractName], this.txParams)
  }
}
