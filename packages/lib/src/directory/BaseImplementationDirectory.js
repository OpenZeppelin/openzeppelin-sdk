import Logger from '../utils/Logger'
import { sendTransaction } from '../utils/Transactions'

import ImplementationDirectoryDeployer from './ImplementationDirectoryDeployer'

export default class BaseImplementationDirectory {

  static deployLocal(contracts = [], txParams = {}) {
    return this.deploy(null, contracts, txParams);
  }

  static async deployDependency(dependencyName, contracts = [], txParams = {}) {
    return this.deploy(dependencyName, contracts, txParams);
  }

  static async deploy(dependencyName, contracts = [], txParams = {}) {
    const deployer = new ImplementationDirectoryDeployer(this.getContractClass(), txParams)
    const directory = await (dependencyName
      ? deployer.deployDependency(dependencyName, contracts)
      : deployer.deployLocal(contracts))
    return new this(directory, txParams) 
  }

  static async fetch(address, txParams = {}) {
    const klazz = this.getContractClass();
    const directory = await klazz.at(address);
    return new this(directory, txParams);
  }

  static getContractClass() {
    throw Error("Unimplemented method getContractClass()")
  }

  constructor(directory, txParams = {}, log = new Logger('BaseImplementationDirectory')) {
    this.directoryContract = directory
    this.txParams = txParams
    this.log = log
  }

  get contract() {
    return this.directoryContract
  }

  get address() {
    return this.directoryContract.address
  }

  async owner() {
    return this.directoryContract.owner(this.txParams)
  }

  async isFrozen() {
    return false
  }

  async getImplementation(contractName) {
    if (!contractName) throw Error('Contract name is required to retrieve an implementation')
    return await this.directoryContract.getImplementation(contractName, this.txParams)
  }

  async setImplementation(contractName, implementationAddress) {
    this.log.info(`Setting ${contractName} implementation ${implementationAddress}...`)
    await sendTransaction(this.directoryContract.setImplementation, [contractName, implementationAddress], this.txParams)
    this.log.info(`Implementation set ${implementationAddress}`)
  }

  async unsetImplementation(contractName) {
    this.log.info(`Unsetting ${contractName} implementation...`)
    await sendTransaction(this.directoryContract.unsetImplementation, [contractName], this.txParams)
    this.log.info(`${contractName} implementation unset`)
  }
}
