import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'
import { deploy, sendTransaction } from '../utils/Transactions'

const log = new Logger('ImplementationDirectoryDeployer')

// TODO: Check whether the deployment with contracts is used from the CLI, and consider removing it or moving to another class (such as project)

export default class ImplementationDirectoryDeployer {
  constructor(contractClass, txParams = {}) {
    this.contractClass = contractClass
    this.txParams = txParams
  }

  async deployLocal(contracts = []) {
    await this.deployImplementationDirectory()
    const deployMethod = async contractName => this._deployLocalContract(contractName)
    await this.deployAndRegisterContracts(contracts, deployMethod)
    return this.directory
  }

  async deployDependency(dependencyName, contracts = []) {
    await this.deployImplementationDirectory()
    const deployMethod = async contractName => this._deployDependencyContract(dependencyName, contractName)
    await this.deployAndRegisterContracts(contracts, deployMethod)
    return this.directory
  }

  async deployImplementationDirectory() {
    log.info(`Deploying a new ${this.contractClass.contractName}...`)
    this.directory = await deploy(this.contractClass, [], this.txParams)
    log.info(`Deployed at ${this.directory.address}`)
  }

  async deployAndRegisterContracts(contracts, deployMethod) {
    await Promise.all(contracts.map(async contract => {
      const { alias: contractAlias, name: contractName } = contract
      const implementation = await deployMethod(contractName)
      log.info(`Registering ${contractAlias} implementation at ${implementation.address} in implementation directory...`)
      await sendTransaction(this.directory.setImplementation, [contractAlias, implementation.address], this.txParams)
      log.info('Implementation set')
    }))
  }

  async _deployLocalContract(contractName) {
    const contractClass = Contracts.getFromLib(contractName)
    log.info(`Deploying new ${contractName}...`)
    const implementation = await deploy(contractClass, [], this.txParams)
    log.info(`Deployed ${contractName} ${implementation.address}`)
    return implementation
  }

  async _deployDependencyContract(dependencyName, contractName) {
    const contractClass = await Contracts.getFromNodeModules(dependencyName, contractName)
    log.info(`Deploying new ${contractName} from dependency ${dependencyName}...`)
    const implementation = await deploy(contractClass, [], this.txParams)
    log.info(`Deployed ${contractName} ${implementation.address}`)
    return implementation
  }
}
