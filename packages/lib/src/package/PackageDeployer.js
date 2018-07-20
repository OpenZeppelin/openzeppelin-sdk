import Package from './Package'
import Contracts from '../utils/Contracts'
import { deploy, sendTransaction } from '../utils/Transactions'

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
    this.package = await deploy(Package, [], this.txParams)
  }
}
