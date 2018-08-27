import Project from "./Project";
import VersionedApp from "../app/VersionedApp";
import Package from "../package/Package";

export default class AppProject extends Project {
  static async fetch(appAddress, name, txParams) {
    const app = await VersionedApp.fetch(appAddress, txParams)
    const packageInfo = await app.getPackage(name)
    const project = new this(app, name, packageInfo.version, txParams)
    project.package = packageInfo.package
    return project
  }

  static async deploy(name = 'main', version = '0.1.0', txParams = {}) {
    const thepackage = await Package.deploy(txParams)
    const directory = await thepackage.newVersion(version)
    const app = await VersionedApp.deploy(txParams)
    await app.setPackage(name, thepackage.address, version)
    const project = new this(app, name, version, txParams)
    project.directory = directory
    project.package = thepackage
    return project
  }

  constructor(app, name = 'main', version = '0.1.0', txParams = {}) {
    super(txParams)
    this.app = app
    this.name = name
    this.version = version
  }

  async newVersion(version) {
    const directory = await super.newVersion(version)
    const thepackage = await this.getProjectPackage()
    await this.app.setPackage(this.name, thepackage.address, version)
    return directory
  } 

  getApp() {
    return this.app
  }

  async getProjectPackage() {
    if (!this.package) {
      const packageInfo = await this.app.getPackage(this.name)
      this.package = packageInfo.package
    }
    return this.package
  }

  async getCurrentDirectory() {
    if (!this.directory) {
      this.directory = await this.app.getProvider(this.name)  
    }
    return this.directory
  }

  async getCurrentVersion() {
    return this.version
  }

  // TODO: Testme
  async changeProxyAdmin(proxyAddress, newAdmin) {
    return this.app.changeProxyAdmin(proxyAddress, newAdmin)
  }

  // TODO: Testme
  async createContract(contractClass, { packageName, contractName, initMethod, initArgs }) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    return this.app.createContract(contractClass, packageName, contractName, initMethod, initArgs)
  }

  // TODO: Testme
  async createProxy(contractClass, { packageName, contractName, initMethod, initArgs }) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    return this.app.createProxy(contractClass, packageName, contractName, initMethod, initArgs)
  }

  // TODO: Testme
  async upgradeProxy(proxyAddress, contractClass, { packageName, contractName, initMethod, initArgs }) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    return this.app.upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethod, initArgs)
  }

  // TODO: Testme
  async getDependencyPackage(name) {
    const packageInfo = await this.app.getPackage(name)
    return packageInfo.package
  }

  // TODO: Testme
  async getDependencyVersion(name) {
    const packageInfo = await this.app.getPackage(name)
    return packageInfo.version
  }

  // TODO: Testme
  async hasDependency(name) {
    return this.app.hasPackage(name)
  }

  // TODO: Testme
  async setDependency(name, packageAddress, version) {
    return this.app.setPackage(name, packageAddress, version)
  }

  // TODO: Testme
  async unsetDependency(name) {
    return this.app.unsetPackage(name)
  }
}
