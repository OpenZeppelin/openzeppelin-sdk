import BasePackageProject from "./BasePackageProject";
import App from "../app/App";
import Package from "../package/Package";
import { DeployError } from '../utils/errors/DeployError';
import _ from 'lodash';
import { semanticVersionToString } from "../utils/Semver";

const DEFAULT_NAME = 'main';
const DEFAULT_VERSION = '0.1.0';

export default class AppProject extends BasePackageProject {

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  static async fetchOrDeploy(name = DEFAULT_NAME, version = DEFAULT_VERSION, txParams = {}, { appAddress = undefined, packageAddress = undefined } = {}) {
    let thepackage, directory, app
    version = semanticVersionToString(version)
    
    try {
      app = appAddress
        ? await App.fetch(appAddress, txParams)
        : await App.deploy(txParams)
      if (packageAddress) {
        thepackage = await Package.fetch(packageAddress, txParams)
      } else if (await app.hasPackage(name, version)) {
        thepackage = (await app.getPackage(name)).package
      } else {
        thepackage = await Package.deploy(txParams)
      }
      directory = await thepackage.hasVersion(version)
        ? await thepackage.getDirectory(version)
        : await thepackage.newVersion(version)
      if (!await app.hasPackage(name, version)) await app.setPackage(name, thepackage.address, version)
      const project = new this(app, name, version, txParams)
      project.directory = directory
      project.package = thepackage
      return project
    } catch(deployError) {
      throw new DeployError(deployError.message, { thepackage, directory, app })
    }
  }

  // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
  static async fromSimpleProject(simpleProject, version = DEFAULT_VERSION, existingAddresses = {}) {
    const appProject = await this.fetchOrDeploy(simpleProject.name, version, simpleProject.txParams, existingAddresses);
    
    await Promise.all(
      _.concat(
        _.map(simpleProject.implementations, (contractInfo, contractAlias) => (
          appProject.registerImplementation(contractAlias, contractInfo)
        )),
        _.map(simpleProject.dependencies, (dependencyInfo, dependencyName) => (
          appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version)
        ))
      ));
    return appProject;
  }

  constructor(app, name = DEFAULT_NAME, version = DEFAULT_VERSION, txParams = {}) {
    super(txParams)
    this.app = app
    this.name = name
    this.version = semanticVersionToString(version)
  }

  async newVersion(version) {
    version = semanticVersionToString(version)
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
  async getImplementation({ packageName, contractName }) {
    return this.app.getImplementation(packageName || this.name, contractName)
  }

  // TODO: Testme
  async createContract(contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    return this.app.createContract(contractClass, packageName, contractName, initMethod, initArgs)
  }

  async createProxy(contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    if (!_.isEmpty(initArgs) && !initMethod) initMethod = 'initialize'
    return this.app.createProxy(contractClass, packageName, contractName, initMethod, initArgs)
  }

  async upgradeProxy(proxyAddress, contractClass, { packageName, contractName, initMethod, initArgs } = {}) {
    if (!contractName) contractName = contractClass.contractName
    if (!packageName) packageName = this.name
    return this.app.upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethod, initArgs)
  }

  async changeProxyAdmin(proxyAddress, newAdmin) {
    return this.app.changeProxyAdmin(proxyAddress, newAdmin)
  }

  async getDependencyPackage(name) {
    const packageInfo = await this.app.getPackage(name)
    return packageInfo.package
  }

  async getDependencyVersion(name) {
    const packageInfo = await this.app.getPackage(name)
    return packageInfo.version
  }

  async hasDependency(name) {
    return this.app.hasPackage(name)
  }

  async setDependency(name, packageAddress, version) {
    return this.app.setPackage(name, packageAddress, version)
  }

  async unsetDependency(name) {
    return this.app.unsetPackage(name)
  }
}
