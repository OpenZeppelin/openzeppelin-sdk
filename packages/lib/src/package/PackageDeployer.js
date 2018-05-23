import Package from './Package'
import Contracts from '../utils/Contracts'

export default class PackageDeployer {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  async deploy() {
    await this._createPackage();
    return new Package(this.package, this.txParams)
  }

  async _createPackage() {
    const Package = Contracts.getFromLib('Package')
    this.package = await Package.new(this.txParams)
  }
}
