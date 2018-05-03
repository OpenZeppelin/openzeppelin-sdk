import DistributionWrapper from "./DistributionWrapper"
import ContractsProvider from "../utils/ContractsProvider"

export default {
  async call(txParams = {}) {
    this.txParams = txParams
    await this._createPackage();
    return new DistributionWrapper(this.package, txParams)
  },

  async _createPackage() {
    const Package = ContractsProvider.getByName('Package')
    this.package = await Package.new(this.txParams)
  }
}
