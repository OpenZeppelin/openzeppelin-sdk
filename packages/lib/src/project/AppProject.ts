import concat from 'lodash.concat';
import map from 'lodash.map';
import isEmpty from 'lodash.isempty';

import App from '../application/App';
import Package from '../application/Package';
import ProxyAdmin from '../proxy/ProxyAdmin';
import ImplementationDirectory from '../application/ImplementationDirectory';
import BasePackageProject from './BasePackageProject';
import SimpleProject from './SimpleProject';
import Contract from '../artifacts/Contract';
import ProxyAdminProject from './ProxyAdminProject';
import { DeployError } from '../utils/errors/DeployError';
import { semanticVersionToString } from '../utils/Semver';

const DEFAULT_NAME: string = 'main';
const DEFAULT_VERSION: string = '0.1.0';

export interface ContractInterface {
  packageName?: string;
  contractName?: string;
  initMethod?: string;
  initArgs?: string[];
  redeployIfChanged?: boolean;
}

interface ExistingAddresses {
  appAddress?: string;
  packageAddress?: string;
  proxyAdminAddress?: string;
}

export default class AppProject extends BasePackageProject {
  private name: string;
  private app: App;
  public proxyAdmin: ProxyAdmin;

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  public static async fetchOrDeploy(name: string = DEFAULT_NAME, version: string = DEFAULT_VERSION, txParams: any = {}, { appAddress, packageAddress, proxyAdminAddress }: ExistingAddresses = {}): Promise<AppProject | never> {
    let thepackage: Package;
    let directory: ImplementationDirectory;
    let app: App;
    version = semanticVersionToString(version);

    try {
      app = appAddress
        ? await App.fetch(appAddress, txParams)
        : await App.deploy(txParams);
      if (packageAddress) thepackage = Package.fetch(packageAddress, txParams);
      else if (await app.hasPackage(name, version)) thepackage = (await app.getPackage(name)).package;
      else thepackage = await Package.deploy(txParams);
      directory = await thepackage.hasVersion(version)
        ? await thepackage.getDirectory(version)
        : await thepackage.newVersion(version);
      if (!await app.hasPackage(name, version)) await app.setPackage(name, thepackage.address, version);
      const proxyAdmin: ProxyAdmin | null = proxyAdminAddress ? await ProxyAdmin.fetch(proxyAdminAddress, txParams) : null;
      const project: AppProject = new this(app, name, version, proxyAdmin, txParams);
      project.directory = directory;
      project.package = thepackage;
      return project;
    } catch(error) {
      throw new DeployError(error, { thepackage, directory, app });
    }
  }

  // REFACTOR: This code is similar to the ProxyAdminProjectDeployer, consider unifying them
  public static async fromProxyAdminProject(proxyAdminProject: ProxyAdminProject, version: string = DEFAULT_VERSION, existingAddresses: ExistingAddresses = {}): Promise<AppProject> {
    const appProject: AppProject = await this.fetchOrDeploy(proxyAdminProject.name, version, proxyAdminProject.txParams, existingAddresses);

    await Promise.all(
      concat(
        map(proxyAdminProject.implementations, (contractInfo, contractAlias) => (
          appProject.registerImplementation(contractAlias, contractInfo)
        )),
        map(proxyAdminProject.dependencies, (dependencyInfo, dependencyName) => (
          appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version)
        ))
      ));
    return appProject;
  }

  // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
  public static async fromSimpleProject(simpleProject: SimpleProject, version: string = DEFAULT_VERSION, existingAddresses: ExistingAddresses = {}): Promise<AppProject> {
    const appProject: AppProject = await this.fetchOrDeploy(simpleProject.name, version, simpleProject.txParams, existingAddresses);

    await Promise.all(
      concat(
        map(simpleProject.implementations, (contractInfo, contractAlias) => (
          appProject.registerImplementation(contractAlias, contractInfo)
        )),
        map(simpleProject.dependencies, (dependencyInfo, dependencyName) => (
          appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version)
        ))
      ));
    return appProject;
  }

  constructor(app: App, name: string = DEFAULT_NAME, version: string = DEFAULT_VERSION, proxyAdmin: ProxyAdmin, txParams: any = {}) {
    super(txParams);
    this.app = app;
    this.name = name;
    this.proxyAdmin = proxyAdmin;
    this.version = semanticVersionToString(version);
    this.txParams = txParams;
  }

  public async newVersion(version: any): Promise<ImplementationDirectory> {
    version = semanticVersionToString(version);
    const directory: ImplementationDirectory = await super.newVersion(version);
    const thepackage: Package = await this.getProjectPackage();
    await this.app.setPackage(this.name, thepackage.address, version);
    return directory;
  }

  public getAdminAddress(): Promise<string> {
    return new Promise((resolve) => resolve(this.proxyAdmin.address));
  }

  public getApp(): App {
    return this.app;
  }

  public getProxyAdmin(): ProxyAdmin {
    return this.proxyAdmin;
  }

  public async getProjectPackage(): Promise<Package> {
    if (!this.package) {
      const packageInfo: { package: Package, version: any } = await this.app.getPackage(this.name);
      this.package = packageInfo.package;
    }
    return this.package;
  }

  public async getCurrentDirectory(): Promise<ImplementationDirectory> {
    if (!this.directory) this.directory = await this.app.getProvider(this.name);
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
  public async createContract(contract: Contract, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<Contract> {
    if (!contractName) contractName = contract.schema.contractName;
    if (!packageName) packageName = this.name;
    return this.app.createContract(contract, packageName, contractName, initMethod, initArgs);
  }

  public async createProxy(contract: Contract, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<Contract> {
    if (!this.proxyAdmin) this.proxyAdmin = await ProxyAdmin.deploy(this.txParams);
    if (!contractName) contractName = contract.schema.contractName;
    if (!packageName) packageName = this.name;
    if (!isEmpty(initArgs) && !initMethod) initMethod = 'initialize';
    return this.app.createProxy(contract, packageName, contractName, this.proxyAdmin.address, initMethod, initArgs);
  }

  public async upgradeProxy(proxyAddress: string, contract: Contract, { packageName, contractName, initMethod, initArgs }: ContractInterface = {}): Promise<Contract> {
    if (!contractName) contractName = contract.schema.contractName;
    if (!packageName) packageName = this.name;
    const implementationAddress = await this.getImplementation({ packageName, contractName });
    return this.proxyAdmin.upgradeProxy(proxyAddress, implementationAddress, contract, initMethod, initArgs);
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    return this.proxyAdmin.changeProxyAdmin(proxyAddress, newAdmin);
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
