import Package from './Package'
import ImplementationDirectoryProvider from '../directory/ImplementationDirectoryProvider'
import FreezableImplementationDirectory from '../directory/FreezableImplementationDirectory'

export default class PackageWithFreezableDirectories extends Package {
  wrapImplementationDirectory(directoryAddress) {
    return ImplementationDirectoryProvider.freezable(directoryAddress, this.txParams)
  }

  async newDirectory() {
    return FreezableImplementationDirectory.deployLocal([], this.txParams)
  }

  async isFrozen(version) {
    const directory = await this.getDirectory(version)
    return await directory.isFrozen()
  }

  async freeze(version) {
    const directory = await this.getDirectory(version)
    await directory.freeze(this.txParams)
  }
}
