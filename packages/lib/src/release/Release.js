import Logger from '../utils/Logger'

import ReleaseDeployer from './ReleaseDeployer'

const log = new Logger('Release')

export default class Release {
  constructor(release, txParams = {}) {
    this._release = release
    this.txParams = txParams
  }

  static async deploy() {
    return await ReleaseDeployer.deploy(...arguments);
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
}
