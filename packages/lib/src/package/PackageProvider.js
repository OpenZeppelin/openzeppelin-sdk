import Logger from '../utils/Logger'
import Package from './Package'

const log = new Logger('PackageProvider')

const PackageProvider = {
  from(address, txParams = {}) {
    this._fetchPackage(address);
    return new Package(this.package, txParams)
  },

  _fetchPackage(address) {
    log.info('Deploying new Package...')
    const Package = Contracts.getFromLib('Package')
    this.package = new Package(address)
    log.info(`Deployed Package ${this.package.address}`)
  }
}

export default PackageProvider
