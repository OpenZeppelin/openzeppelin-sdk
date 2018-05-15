import { Contracts, Logger, FileSystem as fs } from 'zos-lib'

const log = new Logger('StdlibDeployer')

const StdlibDeployer = {
  async deploy(name, txParams = {}) {
    this.txParams = txParams
    this._parseJsonData(name)
    await this._createImplementationDirectory()
    await this._deployContracts(name)
    return this.implementationDirectory.address
  },

  async _createImplementationDirectory() {
    log.info('Deploying new ImplementationDirectory...')
    const ImplementationDirectory = Contracts.getFromLib('ImplementationDirectory')
    this.implementationDirectory = await ImplementationDirectory.new(this.txParams)
    log.info(`Deployed ImplementationDirectory ${this.implementationDirectory.address}`)
  },

  async _deployContracts(name) {
    await Promise.all(this._contractsList().map(async contractAlias => {
      const deployed = await this._deployContract(name, contractAlias)
      await this.implementationDirectory.setImplementation(contractAlias, deployed.address, this.txParams)
    }))
  },

  async _deployContract(name, contractAlias) {
    log.info(`Deploying new ${contractAlias}...`)
    const contractName = this.jsonData.contracts[contractAlias]
    const contractClass = await Contracts.getFromNodeModules(name, contractName)
    const contract = await contractClass.new(this.txParams)
    log.info(`Deployed ${contractAlias} ${contract.address}`)
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

export default StdlibDeployer;
