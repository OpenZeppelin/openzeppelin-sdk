import Package from './Package'
import ImplementationDirectory from '../directory/ImplementationDirectory'
import ImplementationDirectoryProvider from '../directory/ImplementationDirectoryProvider'

export default class PackageWithNonFreezableDirectories extends Package {
  wrapImplementationDirectory(directoryAddress) {
    return ImplementationDirectoryProvider.nonFreezable(directoryAddress, this.txParams)
  }

  async newDirectory() {
    return ImplementationDirectory.deployLocal([], this.txParams)
  }
}
