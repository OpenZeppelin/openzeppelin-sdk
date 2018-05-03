import _ from 'lodash'
import fs from '../zos-lib/utils/FileSystem'
import StdlibDeployer from "./stdlib/StdlibDeployer"
import ContractsProvider from "../zos-lib/utils/ContractsProvider"
import AppManagerDeployer from "../zos-lib/app_manager/AppManagerDeployer"

export default {
  async call(packageData = null, txParams = {}) {
    this.txParams = txParams
    if(!packageData) packageData = fs.parseJson('package.zos.json')
    const appManager = await AppManagerDeployer.call(packageData.version, this.txParams)
    const directory = appManager.currentDirectory()
    await this._deployStdlib(directory, packageData)
    await this._deployAllContracts(directory, packageData)
    return appManager
  },

  async _deployAllContracts(directory, packageData) {
    await Promise.all(_.map(packageData.contracts, async (contractName, contractAlias) => {
      const contractClass = await ContractsProvider.getFromArtifacts(contractName)
      const deployed = await contractClass.new(this.txParams)
      await directory.setImplementation(contractAlias, deployed.address, this.txParams)
    }))
  },

  async _deployStdlib(directory, packageData) {
    if (!_.isEmpty(packageData.stdlib)) {
      const stdlibAddress = await StdlibDeployer.call(packageData.stdlib.name, this.txParams)
      await directory.setStdlib(stdlibAddress, this.txParams)
    }
  }
}
