import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'

import Package from './Package'

const log = new Logger('PackageProvider')

const PackageProvider = {
  from(address, txParams = {}) {
    this._fetchPackage(address);
    return new Package(this.package, txParams)
  },

  _fetchPackage(address) {
    const Package = Contracts.getFromLib('Package')
    this.package = new Package(address)
  }
}

export default PackageProvider
