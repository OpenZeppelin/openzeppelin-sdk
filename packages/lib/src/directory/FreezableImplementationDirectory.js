import Logger from '../utils/Logger'
import { sendTransaction } from '../utils/Transactions'

import ImplementationDirectory from './ImplementationDirectory'
import ImplementationDirectoryDeployer from './ImplementationDirectoryDeployer'

export default class FreezableImplementationDirectory extends ImplementationDirectory {

  static async deployLocal(contracts, txParams = {}) {
    const deployer = ImplementationDirectoryDeployer.freezable(txParams)
    const directory = await deployer.deployLocal(contracts)
    return new FreezableImplementationDirectory(directory, txParams)
  }

  static async deployDependency(dependencyName, contracts, txParams = {}) {
    const deployer = ImplementationDirectoryDeployer.freezable(txParams);
    const directory = await deployer.deployDependency(dependencyName, contracts)
    return new FreezableImplementationDirectory(directory, txParams)
  }

  constructor(directory, txParams = {}) {
    const log = new Logger('FreezableImplementationDirectory')
    super(directory, txParams, log)
  }

  async freeze() {
    this.log.info('Freezing implementation directory...')
    await sendTransaction(this.directory.freeze, [], this.txParams)
    this.log.info('Frozen')
  }

  async isFrozen() {
    return await this.directory.frozen()
  }
}
