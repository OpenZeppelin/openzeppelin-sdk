'use strict';

import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'
import { deploy } from '../utils/Transactions'

import AppDirectory from './AppDirectory'

const log = new Logger('AppDirectoryDeployer')

export default class AppDirectoryDeployer {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  async deploy(stdlibAddress = 0x0) {
    await this._deployAppDirectory(stdlibAddress)
    return new AppDirectory(this.directory, this.txParams)
  }

  async _deployAppDirectory(stdlibAddress) {
    log.info('Deploying new AppDirectory...')
    const AppDirectory = Contracts.getFromLib('AppDirectory')
    this.directory = await deploy(AppDirectory, [stdlibAddress], this.txParams)
    log.info(`App directory created at ${this.directory.address}`)
  }
}
