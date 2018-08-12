import Logger from '../utils/Logger'
import { sendTransaction } from '../utils/Transactions'
import BaseImplementationDirectory from './BaseImplementationDirectory'
import Contracts from '../utils/Contracts';

export default class FreezableImplementationDirectory extends BaseImplementationDirectory {

  static getContractClass() {
    return Contracts.getFromLib('FreezableImplementationDirectory')
  }

  constructor(directory, txParams = {}) {
    super(directory, txParams, new Logger('FreezableImplementationDirectory'))
  }

  async freeze() {
    this.log.info('Freezing implementation directory...')
    await sendTransaction(this.directoryContract.freeze, [], this.txParams)
    this.log.info('Frozen')
  }

  async isFrozen() {
    return await this.directoryContract.frozen()
  }
}
