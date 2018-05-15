import Release from './Release'
import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'

const log = new Logger('ReleaseDeployer')

const ReleaseDeployer = {
  async deploy(contracts, txParams = {}) {
    this.txParams = txParams
    await this.deployRelease()
    await this.deployAndRegisterContracts(contracts, this._deployLocalContract)
    return new Release(this.release, txParams)
  },

  async deployRelease() {
    log.info("Deploying a new Release...")
    const Release = Contracts.getFromLib('Release')
    this.release = await Release.new(this.txParams)
    log.info(`Deployed at ${this.release.address}`)
  },

  async deployAndRegisterContracts(contracts, deployContract) {
    await Promise.all(contracts.map(async contract => {
      const { alias: contractAlias, name: contractName } = contract
      const implementation = await deployContract(contractName)
      log.info('Registering implementation in release...')
      await this.release.setImplementation(contractAlias, implementation.address, this.txParams)
    }))
  },

  async _deployLocalContract(contractName) {
    const contractClass = Contracts.getFromLib(contractName)
    return await ReleaseDeployer._deployContract(contractName, contractClass)
  },

  async _deployContract(contractName, contractClass) {
    log.info(`Deploying new ${contractName}...`)
    const implementation = await contractClass.new()
    log.info(`Deployed ${contractName} ${implementation.address}`)
    return implementation
  },
}

export default ReleaseDeployer
