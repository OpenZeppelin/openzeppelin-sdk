import Contracts from '../utils/Contracts'
import App from './App'

const AppProvider = {
  async from(address, txParams = {}) {
    this._fetchPackagedApp(address)
    await this._fetchFactory()
    await this._fetchPackage()
    await this._fetchAppDirectory()
    return new App(this.packagedApp, this.factory, this.appDirectory, this.package, this.version, txParams);
  },

  _fetchPackagedApp(address) {
    const PackagedApp = Contracts.getFromLib('PackagedApp')
    this.packagedApp = new PackagedApp(address)
  },
  
  async _fetchAppDirectory() {
    const AppDirectory = Contracts.getFromLib('AppDirectory')
    this.version = await this.packagedApp.version()
    const appDirectoryAddress = await this.package.getVersion(this.version)
    this.appDirectory = new AppDirectory(appDirectoryAddress)
  },
  
  async _fetchPackage() {
    const Package = Contracts.getFromLib('Package')
    const packageAddress = await this.packagedApp.package()
    this.package = new Package(packageAddress)
  },

  async _fetchFactory() {
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    const factoryAddress = await this.packagedApp.factory()
    this.factory = new UpgradeabilityProxyFactory(factoryAddress)
  }
}

export default AppProvider;
