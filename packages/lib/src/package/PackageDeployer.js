import Package from './Package'

/**
 *
 */
const PackageDeployer = {
  async deploy(txParams = {}) {
    this.txParams = txParams
    await this._createPackage();
    return new Package(this.package, txParams)
  },

  async _createPackage() {
    const Package = Contracts.getFromLib('Package')
    this.package = await Package.new(this.txParams)
  }
}

export default PackageDeployer
