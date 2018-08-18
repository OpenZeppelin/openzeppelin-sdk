import { Contracts, Release, FileSystem as fs } from 'zos-lib'

const DependencyDeployer = {
  async deploy(stdlibName, txParams = {}) {
    const release = await this._createRelease(stdlibName, txParams)
    return release.address()
  },

  async _createRelease(stdlibName, txParams) {
    const contractsList = this._jsonData(stdlibName).contracts;
    const contractsData = Object.keys(contractsList).map(alias => ({ alias, name: contractsList[alias] }))
    return await Release.deployDependency(stdlibName, contractsData, txParams)
  },

  _jsonData(stdlibName) {
    const filename = `node_modules/${stdlibName}/zos.json`
    return fs.parseJson(filename)
  }
}

export default DependencyDeployer;
