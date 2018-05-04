import DistributionWrapper from './DistributionWrapper'

export default {
  async call(txParams = {}) {
    this.txParams = txParams
    await this._createPackage();
    return new DistributionWrapper(this.package, txParams)
  },

  async _createPackage() {
    const Package = ContractsProvider.getFromLib('Package')
    this.package = await Package.new(this.txParams)
  }
}
