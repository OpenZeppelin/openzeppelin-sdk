import AppManagerWrapper from "./AppManagerWrapper"
import ContractsProvider from "../utils/ContractsProvider"

export default {
  async from(address, txParams = {}) {
    this._fetchPackagedAppManager(address)
    await this._fetchFactory()
    await this._fetchPackage()
    await this._fetchAppDirectory()
    return new AppManagerWrapper(this.packagedAppManager, this.factory, this.appDirectory, this.package, this.version, txParams);
  },

  _fetchPackagedAppManager(address) {
    const PackagedAppManager = ContractsProvider.getByName('PackagedAppManager')
    this.packagedAppManager = new PackagedAppManager(address)
  },
  
  async _fetchAppDirectory() {
    const AppDirectory = ContractsProvider.getByName('AppDirectory')
    this.version = await this.packagedAppManager.version()
    const appDirectoryAddress = await this.package.getVersion(this.version)
    this.appDirectory = new AppDirectory(appDirectoryAddress)
  },
  
  async _fetchPackage() {
    const Package = ContractsProvider.getByName('Package')
    const packageAddress = await this.packagedAppManager.package()
    this.package = new Package(packageAddress)
  },

  async _fetchFactory() {
    const UpgradeabilityProxyFactory = ContractsProvider.getByName('UpgradeabilityProxyFactory')
    const factoryAddress = await this.packagedAppManager.factory()
    this.factory = new UpgradeabilityProxyFactory(factoryAddress)
  }
}
