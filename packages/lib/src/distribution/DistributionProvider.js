import Logger from '../utils/Logger'
import DistributionWrapper from './DistributionWrapper'

const log = new Logger('DistributionProvider')

export  default {
  from(address, txParams = {}) {
    this._fetchPackage(address);
    return new DistributionWrapper(this.package, txParams)
  },

  _fetchPackage(address) {
    log.info('Deploying new Package...')
    const Package = ContractsProvider.getFromLib('Package')
    this.package = new Package(address)
    log.info(`Deployed Package ${this.package.address}`)
  }
}
