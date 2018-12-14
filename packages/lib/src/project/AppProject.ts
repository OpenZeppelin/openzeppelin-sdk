import _ from 'lodash';

import App from '../application/App';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import BasePackageProject from './BasePackageProject';
import SimpleProject from './SimpleProject';
import ContractFactory, { ContractWrapper }  from '../artifacts/ContractFactory';
import { DeployError } from '../utils/errors/DeployError';
import { semanticVersionToString } from '../utils/Semver';

const DEFAULT_NAME: string = 'main';
const DEFAULT_VERSION: string = '0.1.0';

interface ContractInterface {
  packageName?: string;
  contractName?: string;
  initMethod?: string;
  initArgs?: string[];
}

interface ExistingAddresses {
  appAddress?: string;
  packageAddress?: string;
}

export default class AppProject extends BasePackageProject {
  private name: string;
  private app: App;

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  public static async fetchOrDeploy(name: string = DEFAULT_NAME, version: string = DEFAULT_VERSION, txParams: any = {}, { appAddress, packageAddress }: ExistingAddresses = {}): Promise<AppProject | never> {
    let thepackage: Package;
    let directory: ImplementationDirectory;
    let app: App;
    version = semanticVersionToString(version);

    try {
      app = appAddress
        ? await App.fetch(appAddress, txParams)
        : await App.deploy(txParams);
      if (packageAddress) {
        thepackage = await Package.fetch(packageAddress, txParams);
      } else if (await app.hasPackage(name, version)) {
        thepackage = (await app.getPackage(name)).package;
      } else {
        thepackage = await Package.deploy(txParams);
      }
      directory = await thepackage.hasVersion(version)
        ? await thepackage.getDirectory(version)
        : await thepackage.newVersion(version);
      if (!await app.hasPackage(name, version)) await app.setPackage(name, thepackage.address, version);
      const project: AppProject = new this(app, name, version, txParams);
      project.directory = directory;
      project.package = thepackage;
      return project;
    } catch(error) {
      throw new DeployError(error, { thepackage, directory, app });
    }
  }

  // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
  public static async fromSimpleProject(simpleProject: SimpleProject, version: string = DEFAULT_VERSION, existingAddresses: ExistingAddresses = {}): Promise<AppProject> {
    const appProject: AppProject = await this.fetchOrDeploy(simpleProject.name, version, simpleProject.txParams, existingAddresses);

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

  constructor(app: App, name: string = DEFAULT_NAME, version: string = DEFAULT_VERSION, txParams: any = {}) {
    super(txParams);
    this.app = app;
    this.name = name;
    this.version = semanticVersionToString(version);
  }

  public async newVersion(version: any): Promise<ImplementationDirectory> {
    version = semanticVersionToString(version);
    const directory: ImplementationDirectory = await super.newVersion(version);
    const thepackage: Package = await this.getProjectPackage();
    await this.app.setPackage(this.name, thepackage.address, version);
    return directory;
  }

  public getApp(): App {
    return this.app;
  }

  public async getProjectPackage(): Promise<Package> {
    if (!this.package) {
      const packageInfo: { package: Package, version: any } = await this.app.getPackage(this.name);
      this.package = packageInfo.package;
    }
    return this.package;
  }

  public async getCurrentDirectory(): Promise<ImplementationDirectory> {
    if (!this.directory) {
      this.directory = await this.app.getProvider(this.name);
    }
    return this.directory;
  }

  public async getCurrentVersion(): Promise<string> {
    return this.version;
  }

  // TODO: Testme
  public async getImplementation({ packageName, contractName }: { contractName: string, packageName?: string }): Promise<string> {
    return this.app.getImplementation(packageName || this.name, contractName);
  }

  // TODO: Testme
  public async createContract(contractClass: ContractFactory, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    return this.app.createContract(contractClass, packageName, contractName, initMethod, initArgs);
  }

  public async createProxy(contractClass: ContractFactory, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    if (!_.isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    return this.app.createProxy(contractClass, packageName, contractName, initMethod, initArgs);
  }

  public async upgradeProxy(proxyAddress: string, contractClass: ContractFactory, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<ContractWrapper> {
    if (!contractName) contractName = contractClass.contractName;
    if (!packageName) packageName = this.name;
    return this.app.upgradeProxy(proxyAddress, contractClass, packageName, contractName, initMethod, initArgs);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    return this.app.changeProxyAdmin(proxyAddress, newAdmin);
  }

  public async getDependencyPackage(name: string): Promise<Package> {
    const packageInfo = await this.app.getPackage(name);
    return packageInfo.package;
  }

  public async getDependencyVersion(name: string): Promise<string> {
    const packageInfo = await this.app.getPackage(name);
    return packageInfo.version;
  }

  public async hasDependency(name): Promise<boolean> {
    return this.app.hasPackage(name);
  }

  public async setDependency(name: string, packageAddress: string, version: string): Promise<boolean> {
    return this.app.setPackage(name, packageAddress, version);
  }

  public async unsetDependency(name: string): Promise<any> {
    return this.app.unsetPackage(name);
  }
}
