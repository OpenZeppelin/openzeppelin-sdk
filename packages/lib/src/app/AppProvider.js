import App from './App'
import Package from '../package/Package'
import Contracts from '../utils/Contracts'
import AppDirectory from '../directory/AppDirectory'

export default class AppProvider {
  constructor(txParams = {}) {
    this.txParams = txParams
  }

  async from(address) {
    this._fetchPackagedApp(address)
    await this._fetchFactory()
    await this._fetchPackage()
    await this._fetchAppDirectory()
    return new App(this.packagedApp, this.factory, this.appDirectory, this.package, this.version, this.txParams);
  }

  _fetchPackagedApp(address) {
    const PackagedApp = Contracts.getFromLib('PackagedApp')
    this.packagedApp = new PackagedApp(address)
  }
  
  async _fetchAppDirectory() {
    this.version = await this.packagedApp.version()
    const appDirectory = await this.package.getDirectory(this.version)
    this.appDirectory = AppDirectory.fetch(appDirectory.address, this.txParams)
  }
  
  async _fetchPackage() {
    const packageAddress = await this.packagedApp.package()
    this.package = Package.fetch(packageAddress, this.txParams)
  }

  async _fetchFactory() {
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    const factoryAddress = await this.packagedApp.factory()
    this.factory = new UpgradeabilityProxyFactory(factoryAddress)
  }
}
