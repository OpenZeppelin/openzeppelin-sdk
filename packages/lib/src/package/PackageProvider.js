import Package from './Package'
import Contracts from '../utils/Contracts'

export default class PackageProvider {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  fetch(address, klass) {
    this._fetchPackage(address);
    return new klass(this.package, this.txParams)
  }

  _fetchPackage(address) {
    const Package = Contracts.getFromLib('Package')
    this.package = new Package(address)
  }
}
