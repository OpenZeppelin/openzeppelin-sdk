import PackageWrapper from './PackageWrapper'

/**
 *
 */
const PackageDeployer = {
  async call(txParams = {}) {
    this.txParams = txParams
    await this._createPackage();
    return new PackageWrapper(this.package, txParams)
  },

  async _createPackage() {
    const Package = Contracts.getFromLib('Package')
    this.package = await Package.new(this.txParams)
  }
}

export default PackageDeployer
