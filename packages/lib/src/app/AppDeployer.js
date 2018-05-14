'use strict';

import Logger from '../utils/Logger'
import AppWrapper from './AppWrapper'

const log = new Logger('AppDeployer')

export default {
  async call(version, txParams = {}) {
    return this.withStdlib(version, 0x0, txParams)
  },

  async withStdlib(version, stdlibAddress, txParams = {}) {
    this.txParams = txParams
    await this.createFactory()
    await this.createPackage()
    await this.createAppDirectory(stdlibAddress)
    await this.addVersion(version)
    await this.createApp(version)
    return new AppWrapper(this.packagedApp, this.factory, this.appDirectory, this.package, this.version, this.txParams)
  },

  async createApp(version) {
    log.info('Deploying new PackagedApp...')
    const PackagedApp = ContractsProvider.getFromLib('PackagedApp')
    this.packagedApp = await PackagedApp.new(this.package.address, version, this.factory.address, this.txParams)
    log.info(`Deployed PackagedApp ${this.packagedApp.address}`)
  },

  async createFactory() {
    log.info('Deploying new UpgradeabilityProxyFactory...')
    const UpgradeabilityProxyFactory = ContractsProvider.getFromLib('UpgradeabilityProxyFactory')
    this.factory = await UpgradeabilityProxyFactory.new(this.txParams)
    log.info(`Deployed UpgradeabilityProxyFactory ${this.factory.address}`)
  },

  async createPackage() {
    log.info('Deploying new Package...')
    const Package = ContractsProvider.getFromLib('Package')
    this.package = await Package.new(this.txParams)
    log.info(`Deployed Package ${this.package.address}`)
  },

  async createAppDirectory(stdlibAddress) {
    log.info('Deploying new AppDirectory...')
    const AppDirectory = ContractsProvider.getFromLib('AppDirectory')
    this.appDirectory = await AppDirectory.new(stdlibAddress, this.txParams)
    log.info(`Deployed AppDirectory ${this.appDirectory.address}`)
  },

  async addVersion(version) {
    log.info('Adding new version...')
    this.version = version
    await this.package.addVersion(version, this.appDirectory.address, this.txParams)
    log.info(`Added version ${version}`)
  }
}
