import { Contracts, Release, FileSystem as fs } from 'zos-lib'

const StdlibDeployer = {
  async deploy(stdlibName, txParams = {}) {
    this.stdlibName = stdlibName
    this.txParams = txParams
    const release = await this._createRelease()
    return release.address()
  },

  async _createRelease() {
    const contractsList = this._jsonData().contracts;
    const contractsData = Object.keys(contractsList).map(alias => ({ alias, name: contractsList[alias] }))
    return await Release.deployDependency(contractsData, this.stdlibName, this.txParams)
  },

  _jsonData() {
    const filename = `node_modules/${this.stdlibName}/zos.json`
    return fs.parseJson(filename)
  }
}

export default StdlibDeployer;
