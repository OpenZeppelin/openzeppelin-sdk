import { Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('StdlibDeployer')

export default {
  async call(name, txParams = {}) {
    this.txParams = txParams
    this._parseJsonData(name)
    await this._createImplementationDirectory()
    await this._deployContracts(name)
    return this.implementationDirectory.address
  },

  async _createImplementationDirectory() {
    log.info('Deploying new ImplementationDirectory...')
    const ImplementationDirectory = ContractsProvider.getFromLib('ImplementationDirectory')
    this.implementationDirectory = await ImplementationDirectory.new(this.txParams)
    log.info(`Deployed ImplementationDirectory ${this.implementationDirectory.address}`)
  },

  async _deployContracts(name) {
    await Promise.all(this._contractsList().map(async (contractName) => {
      const deployed = await this._deployContract(name, contractName)
      await this.implementationDirectory.setImplementation(contractName, deployed.address, this.txParams)
    }))
  },

  async _deployContract(name, contractName) {
    log.info(`Deploying new ${contractName}...`)
    const contractClass = await ContractsProvider.getFromStdlib(name, contractName)
    const contract = await contractClass.new(this.txParams)
    log.info(`Deployed ${contractName} ${contract.address}`)
    return contract
  },
  
  _contractsList() {
    return Object.keys(this.jsonData.contracts)
  },
  
  _parseJsonData(name) {
    const filename = `node_modules/${name}/package.zos.json`
    this.jsonData = fs.parseJson(filename)
  }
}
