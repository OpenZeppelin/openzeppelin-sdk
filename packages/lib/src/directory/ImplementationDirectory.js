import Logger from '../utils/Logger'
import { sendTransaction } from '../utils/Transactions'

import ImplementationDirectoryDeployer from './ImplementationDirectoryDeployer'

export default class ImplementationDirectory {

  static async deployLocal(contracts, txParams = {}) {
    const deployer = ImplementationDirectoryDeployer.nonFreezable(txParams)
    const directory = await deployer.deployLocal(contracts);
    return new ImplementationDirectory(directory, txParams)
  }

  static async deployDependency(dependencyName, contracts, txParams = {}) {
    const deployer = ImplementationDirectoryDeployer.nonFreezable(txParams)
    const directory = await deployer.deployDependency(dependencyName, contracts)
    return new ImplementationDirectory(directory, txParams)
  }

  constructor(directory, txParams = {}, log = new Logger('ImplementationDirectory')) {
    this.directory = directory
    this.txParams = txParams
    this.log = log
  }

  get address() {
    return this.directory.address
  }

  async owner() {
    return this.directory.owner(this.txParams)
  }

  async getImplementation(contractName) {
    return await this.directory.getImplementation(contractName, this.txParams)
  }

  async setImplementation(contractName, implementationAddress) {
    this.log.info(`Setting ${contractName} implementation ${implementationAddress}...`)
    await sendTransaction(this.directory.setImplementation, [contractName, implementationAddress], this.txParams)
    this.log.info(`Implementation set ${implementationAddress}`)
  }

  async unsetImplementation(contractName) {
    this.log.info(`Unsetting ${contractName} implementation...`)
    await sendTransaction(this.directory.unsetImplementation, [contractName], this.txParams)
    this.log.info(`${contractName} implementation unset`)
  }
}
