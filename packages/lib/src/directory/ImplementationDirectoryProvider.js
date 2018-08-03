import Contracts from '../utils/Contracts'
import ImplementationDirectory from './ImplementationDirectory'
import FreezableImplementationDirectory from './FreezableImplementationDirectory'

export default class ImplementationDirectoryProvider {
  static freezable(address, txParams = {}) {
    const contractClass = Contracts.getFromLib('FreezableImplementationDirectory')
    const directory = new contractClass(address)
    return new FreezableImplementationDirectory(directory, txParams)
  }

  static nonFreezable(address, txParams = {}) {
    const contractClass = Contracts.getFromLib('ImplementationDirectory')
    const directory = new contractClass(address)
    return new ImplementationDirectory(directory, txParams)
  }
}
