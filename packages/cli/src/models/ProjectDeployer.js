import _ from 'lodash'
import Stdlib from "./stdlib/Stdlib"
import { Contracts, FileSystem as fs, App } from 'zos-lib'

const ProjectDeployer = {
  async call(packageData = null, txParams = {}) {
    this.txParams = txParams
    if(!packageData) packageData = fs.parseJson('package.zos.json')
    const app = await App.deploy(packageData.version, this.txParams)
    const directory = app.currentDirectory()
    await this._deployStdlib(directory, packageData)
    await this._deployAllContracts(directory, packageData)
    return app
  },

  async _deployAllContracts(directory, packageData) {
    await Promise.all(_.map(packageData.contracts, async (contractName, contractAlias) => {
      const contractClass = await Contracts.getFromLocal(contractName)
      const deployed = await contractClass.new(this.txParams)
      await directory.setImplementation(contractAlias, deployed.address, this.txParams)
    }))
  },

  async _deployStdlib(directory, packageData) {
    if (!_.isEmpty(packageData.stdlib)) {
      const stdlibAddress = await Stdlib.deploy(packageData.stdlib.name, this.txParams)
      await directory.setStdlib(stdlibAddress, this.txParams)
    }
  }
}

export default ProjectDeployer
