import Logger from '../../src/utils/Logger'

const log = new Logger('Release')

export default class ReleaseWrapper {
  constructor(release, txParams = {}) {
    this.release = release
    this.txParams = txParams
  }

  address() {
    return this.release.address
  }

  async owner() {
    return await this.release.owner(this.txParams)
  }

  async freeze() {
    log.info("Freezing release...")
    await this.release.freeze(this.txParams)
  }

  async isFrozen() {
    return await this.release.frozen(this.txParams)
  }

  async getImplementation(contractName) {
    return await this.release.getImplementation(contractName, this.txParams)
  }
}
