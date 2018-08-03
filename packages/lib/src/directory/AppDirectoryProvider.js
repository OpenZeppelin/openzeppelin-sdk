'use strict';

import Contracts from '../utils/Contracts'
import AppDirectory from './AppDirectory'

export default class AppDirectoryProvider {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  fetch(address) {
    this._fetchAppDirectory(address)
    return new AppDirectory(this.directory, this.txParams)
  }

  _fetchAppDirectory(address) {
    const AppDirectoryContract = Contracts.getFromLib('AppDirectory')
    this.directory = new AppDirectoryContract(address)
  }
}
