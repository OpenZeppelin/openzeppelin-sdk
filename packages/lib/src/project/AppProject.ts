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
import ProxyFactory from '../proxy/ProxyFactory';
import { CalldataInfo, buildCallData, callDescription } from '../utils/ABIs';
import Logger from '../utils/Logger';

const DEFAULT_NAME: string = 'main';
const DEFAULT_VERSION: string = '0.1.0';

const log: Logger = new Logger('AppProject');

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
  proxyFactoryAddress?: string;
}

export default class AppProject extends BasePackageProject {
  private name: string;
  private app: App;
  public proxyAdmin: ProxyAdmin;
  public proxyFactory: ProxyFactory;

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  public static async fetchOrDeploy(
    name: string = DEFAULT_NAME,
    version: string = DEFAULT_VERSION,
    txParams: any = {},
    { appAddress, packageAddress, proxyAdminAddress, proxyFactoryAddress }: ExistingAddresses = {}
  ): Promise<AppProject | never> {
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
      const proxyFactory = ProxyFactory.tryFetch(proxyFactoryAddress, txParams);
      const project: AppProject = new this(app, name, version, proxyAdmin, proxyFactory, txParams);
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

  constructor(app: App, name: string = DEFAULT_NAME, version: string = DEFAULT_VERSION, proxyAdmin: ProxyAdmin, proxyFactory: ProxyFactory, txParams: any = {}) {
    super(txParams);
    this.app = app;
    this.name = name;
    this.proxyAdmin = proxyAdmin;
    this.proxyFactory = proxyFactory;
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

  public async ensureProxyAdmin(): Promise<ProxyAdmin> {
    if (!this.proxyAdmin) {
      this.proxyAdmin = await ProxyAdmin.deploy(this.txParams);
    }
    return this.proxyAdmin;
  }

  public async ensureProxyFactory(): Promise<ProxyFactory> {
    if (!this.proxyFactory) {
      this.proxyFactory = await ProxyFactory.deploy(this.txParams);
    }
    return this.proxyFactory;
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

  public async createProxy(contract: Contract, contractInterface: ContractInterface = {}): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
    const proxyAdmin = await this.ensureProxyAdmin();
    return this.app.createProxy(contract, packageName, contractName, proxyAdmin.address, initMethod, initArgs);
  }

  protected getContractInterface(contract: Contract, { contractName, packageName, initMethod, initArgs }: ContractInterface = {}): ContractInterface {
    if (!contractName) {
      contractName = contract.schema.contractName;
    }
    if (!packageName) {
      packageName = this.name;
    }
    if (!isEmpty(initArgs) && !initMethod) {
      initMethod = 'initialize';
    }
    return { contractName, packageName, initArgs, initMethod };
  }

  public async createProxyWithSalt(contract: Contract, salt: string, contractInterface: ContractInterface = {}): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
    const implementationAddress = await this.app.getImplementation(packageName, contractName);
    const initCallData = this.getInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');

    const proxyFactory = await this.ensureProxyFactory();
    const proxyAdmin = await this.ensureProxyAdmin();
    const proxy = await proxyFactory.createProxy(salt, implementationAddress, proxyAdmin.address, initCallData);

    log.info(`Instance created at ${proxy.address}`);
    return contract.at(proxy.address);
  }

  public async getProxyDeploymentAddress(salt: string): Promise<string> {
    const proxyFactory = await this.ensureProxyFactory();
    return proxyFactory.getDeploymentAddress(salt);
  }

  public async upgradeProxy(proxyAddress: string, contract: Contract, contractInterface: ContractInterface = {}): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
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

  // REFACTOR: Deduplicate from BaseSimpleProject
  protected getInitCallData(contract: Contract, initMethodName?: string, initArgs?: string[], implementationAddress?: string, actionLabel?: string): string | null {
    if (initMethodName) {
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
      if (actionLabel) log.info(`${actionLabel} proxy to logic contract ${implementationAddress} and initializing by calling ${callDescription(initMethod, initArgs)}`);
      return callData;
    } else {
      if (actionLabel) log.info(`${actionLabel} proxy to logic contract ${implementationAddress}`);
      return null;
    }
  }
}
