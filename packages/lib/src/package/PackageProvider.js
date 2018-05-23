import Package from './Package'
import Contracts from '../utils/Contracts'

export default class PackageProvider {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  from(address) {
    this._fetchPackage(address);
    return new Package(this.package, this.txParams)
  }

  _fetchPackage(address) {
    const Package = Contracts.getFromLib('Package')
    this.package = new Package(address)
  }
}
