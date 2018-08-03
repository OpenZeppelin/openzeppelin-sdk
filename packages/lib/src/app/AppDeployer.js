'use strict';

import Logger from '../utils/Logger'
import Contracts from '../utils/Contracts'
import { deploy, sendTransaction } from '../utils/Transactions'

import App from './App'
import Package from '../package/Package'

const log = new Logger('AppDeployer')

export default class AppDeployer {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  async deploy(version) {
    return this.deployWithStdlib(version, 0x0)
  }

  async deployWithStdlib(version, stdlibAddress) {
    await this.createFactory()
    await this.createPackage()
    await this.addVersion(version, stdlibAddress)
    await this.createApp(version)
    return new App(this.packagedApp, this.factory, this.appDirectory, this.package, this.version, this.txParams)
  }

  async createApp(version) {
    log.info('Deploying new PackagedApp...')
    const PackagedApp = Contracts.getFromLib('PackagedApp')
    this.packagedApp = await deploy(PackagedApp, [this.package.address, version, this.factory.address], this.txParams)
    log.info(`Deployed PackagedApp ${this.packagedApp.address}`)
  }

  async createFactory() {
    log.info('Deploying new UpgradeabilityProxyFactory...')
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    this.factory = await deploy(UpgradeabilityProxyFactory, [], this.txParams)
    log.info(`Deployed UpgradeabilityProxyFactory ${this.factory.address}`)
  }

  async createPackage() {
    this.package = await Package.deploy(this.txParams)
  }

  async addVersion(version, stdlibAddress) {
    this.version = version
    this.appDirectory = await this.package.newVersion(version, stdlibAddress)
  }
}
