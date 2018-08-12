import Logger from '../utils/Logger'

import BaseImplementationDirectory from './BaseImplementationDirectory'
import Contracts from '../utils/Contracts';

export default class ImplementationDirectory extends BaseImplementationDirectory {

  static getContractClass() {
    return Contracts.getFromLib('ImplementationDirectory')
  }

  constructor(directory, txParams = {}) {
    super(directory, txParams, new Logger('ImplementationDirectory'))
  }

}
