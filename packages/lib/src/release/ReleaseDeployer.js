import Release from './Release'
import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'

const log = new Logger('ReleaseDeployer')

export default class ReleaseDeployer {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  async deployLocal(contracts) {
    await this.deployRelease()
    const deployMethod = async contractName => this._deployLocalContract(contractName)
    await this.deployAndRegisterContracts(contracts, deployMethod)
    return new Release(this.release, this.txParams)
  }

  async deployDependency(dependencyName, contracts) {
    await this.deployRelease()
    const deployMethod = async contractName => this._deployDependencyContract(dependencyName, contractName)
    await this.deployAndRegisterContracts(contracts, deployMethod)
    return new Release(this.release, this.txParams)
  }

  async deployRelease() {
    log.info("Deploying a new Release...")
    const Release = Contracts.getFromLib('Release')
    this.release = await Release.new(this.txParams)
    log.info(`Deployed at ${this.release.address}`)
  }

  async deployAndRegisterContracts(contracts, deployMethod) {
    await Promise.all(contracts.map(async contract => {
      const { alias: contractAlias, name: contractName } = contract
      const implementation = await deployMethod(contractName)
      log.info('Registering implementation in release...')
      await this.release.setImplementation(contractAlias, implementation.address, this.txParams)
    }))
  }

  async _deployLocalContract(contractName) {
    const contractClass = Contracts.getFromLib(contractName)
    log.info(`Deploying new ${contractName}...`)
    const implementation = await contractClass.new()
    log.info(`Deployed ${contractName} ${implementation.address}`)
    return implementation
  }

  async _deployDependencyContract(dependencyName, contractName) {
    const contractClass = await Contracts.getFromNodeModules(dependencyName, contractName)
    log.info(`Deploying new ${contractName} from dependency ${dependencyName}...`)
    const implementation = await contractClass.new()
    log.info(`Deployed ${contractName} ${implementation.address}`)
    return implementation
  }
}
