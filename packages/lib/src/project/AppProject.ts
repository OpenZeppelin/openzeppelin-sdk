import concat from 'lodash.concat';
import map from 'lodash.map';
import isEmpty from 'lodash.isempty';

import App from '../application/App';
import Package from '../application/Package';
import ProxyAdmin from '../proxy/ProxyAdmin';
import ProxyAdminProjectMixin from './mixin/ProxyAdminProjectMixin';
import ImplementationDirectory from '../application/ImplementationDirectory';
import BasePackageProject from './BasePackageProject';
import SimpleProject from './SimpleProject';
import Contract from '../artifacts/Contract';
import ProxyAdminProject from './ProxyAdminProject';
import { DeployError } from '../utils/errors/DeployError';
import { semanticVersionToString } from '../utils/Semver';
import ProxyFactory from '../proxy/ProxyFactory';
import { CalldataInfo, buildCallData, callDescription } from '../utils/ABIs';
import { TxParams } from '../artifacts/ZWeb3';
import { Loggy } from '../utils/Logger';

const DEFAULT_NAME = 'main';
const DEFAULT_VERSION = '0.1.0';

export interface ContractInterface {
  packageName?: string;
  contractName?: string;
  initMethod?: string;
  initArgs?: string[];
  redeployIfChanged?: boolean;
  admin?: string;
}

interface ExistingAddresses {
  appAddress?: string;
  packageAddress?: string;
  proxyAdminAddress?: string;
  proxyFactoryAddress?: string;
}

class BaseAppProject extends BasePackageProject {
  private name: string;
  private app: App;
  public proxyAdmin: ProxyAdmin;
  public proxyFactory: ProxyFactory;

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  public static async fetchOrDeploy(
    name: string = DEFAULT_NAME,
    version: string = DEFAULT_VERSION,
    txParams: TxParams = {},
    { appAddress, packageAddress, proxyAdminAddress, proxyFactoryAddress }: ExistingAddresses = {},
  ): Promise<AppProject | never> {
    let thepackage: Package;
    let directory: ImplementationDirectory;
    let app: App;
    version = semanticVersionToString(version);

    try {
      if (appAddress) {
        app = await App.fetch(appAddress, txParams);
      } else {
        Loggy.spin(
          __filename,
          'fetchOrDeploy',
          `publish-project`,
          'Preparing everything to publish the project. Deploying new App contract',
        );
        app = await App.deploy(txParams);
      }

      if (packageAddress) {
        thepackage = Package.fetch(packageAddress, txParams);
      } else if (await app.hasPackage(name, version)) {
        thepackage = (await app.getPackage(name)).package;
      } else {
        Loggy.spin(__filename, 'fetchOrDeploy', `publish-project`, 'Deploying new Package contract');
        thepackage = await Package.deploy(txParams);
      }

      if (await thepackage.hasVersion(version)) {
        directory = await thepackage.getDirectory(version);
      } else {
        Loggy.spin(
          __filename,
          'fetchOrDeploy',
          `publish-project`,
          `Adding new version ${version} and creating ImplementationDirectory contract`,
        );
        directory = await thepackage.newVersion(version);
        const succeedText =
          !appAddress || !packageAddress ? `Project structure deployed` : `Version ${version} deployed`;

        Loggy.succeed(`publish-project`, succeedText);
      }

      if (!(await app.hasPackage(name, version))) await app.setPackage(name, thepackage.address, version);

      const proxyAdmin: ProxyAdmin | null = proxyAdminAddress
        ? await ProxyAdmin.fetch(proxyAdminAddress, txParams)
        : null;
      const proxyFactory = ProxyFactory.tryFetch(proxyFactoryAddress, txParams);
      const project: AppProject = new AppProject(app, name, version, proxyAdmin, proxyFactory, txParams);
      project.directory = directory;
      project.package = thepackage;
      return project;
    } catch (error) {
      throw new DeployError(error, { thepackage, directory, app });
    }
  }

  // REFACTOR: This code is similar to the ProxyAdminProjectDeployer, consider unifying them
  public static async fromProxyAdminProject(
    proxyAdminProject: ProxyAdminProject,
    version: string = DEFAULT_VERSION,
    existingAddresses: ExistingAddresses = {},
  ): Promise<AppProject> {
    const appProject: AppProject = await this.fetchOrDeploy(
      proxyAdminProject.name,
      version,
      proxyAdminProject.txParams,
      existingAddresses,
    );

    await Promise.all(
      concat<Promise<void | boolean>>(
        map(proxyAdminProject.implementations, (contractInfo, contractAlias) =>
          appProject.registerImplementation(contractAlias, contractInfo),
        ),
        map(proxyAdminProject.dependencies, (dependencyInfo, dependencyName) =>
          appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version),
        ),
      ),
    );
    return appProject;
  }

  // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
  public static async fromSimpleProject(
    simpleProject: SimpleProject,
    version: string = DEFAULT_VERSION,
    existingAddresses: ExistingAddresses = {},
  ): Promise<AppProject> {
    const appProject: AppProject = await this.fetchOrDeploy(
      simpleProject.name,
      version,
      simpleProject.txParams,
      existingAddresses,
    );

    await Promise.all(
      concat<Promise<void | boolean>>(
        map(simpleProject.implementations, (contractInfo, contractAlias) =>
          appProject.registerImplementation(contractAlias, contractInfo),
        ),
        map(simpleProject.dependencies, (dependencyInfo, dependencyName) =>
          appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version),
        ),
      ),
    );
    return appProject;
  }

  public constructor(
    app: App,
    name: string = DEFAULT_NAME,
    version: string = DEFAULT_VERSION,
    proxyAdmin: ProxyAdmin,
    proxyFactory: ProxyFactory,
    txParams: TxParams = {},
  ) {
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
    return new Promise(resolve => resolve(this.proxyAdmin ? this.proxyAdmin.address : null));
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
      const packageInfo: {
        package: Package;
        version: any;
      } = await this.app.getPackage(this.name);
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

  public async getImplementation({
    packageName,
    contractName,
    contract,
  }: {
    contractName?: string;
    packageName?: string;
    contract?: Contract;
  }): Promise<string> {
    return this.app.getImplementation(packageName || this.name, contractName || contract.schema.contractName);
  }

  public async createProxy(contract: Contract, contractInterface: ContractInterface = {}): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs, admin } = this.getContractInterface(
      contract,
      contractInterface,
    );
    const proxyAdmin = admin || (await this.ensureProxyAdmin()).address;
    return this.app.createProxy(contract, packageName, contractName, proxyAdmin, initMethod, initArgs);
  }

  protected getContractInterface(contract: Contract, opts: ContractInterface = {}): ContractInterface {
    let { contractName, packageName, initMethod } = opts;

    if (!contractName) {
      contractName = contract.schema.contractName;
    }
    if (!packageName) {
      packageName = this.name;
    }
    if (!isEmpty(opts.initArgs) && !initMethod) {
      initMethod = 'initialize';
    }

    return { ...opts, contractName, packageName, initMethod };
  }

  public async createProxyWithSalt(
    contract: Contract,
    salt: string,
    signature?: string,
    contractInterface: ContractInterface = {},
  ): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs, admin } = this.getContractInterface(
      contract,
      contractInterface,
    );
    const implementationAddress = await this.app.getImplementation(packageName, contractName);
    const initCallData = this.getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');

    const proxyFactory = await this.ensureProxyFactory();
    const proxyAdmin = admin || (await this.ensureProxyAdmin()).address;
    const proxy = await proxyFactory.createProxy(salt, implementationAddress, proxyAdmin, initCallData, signature);
    Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);

    return contract.at(proxy.address);
  }

  public async createMinimalProxy(contract: Contract, contractInterface: ContractInterface = {}): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
    const implementationAddress = await this.app.getImplementation(packageName, contractName);
    const initCallData = this.getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');

    const proxyFactory = await this.ensureProxyFactory();
    const proxy = await proxyFactory.createMinimalProxy(implementationAddress, initCallData);
    Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);

    return contract.at(proxy.address);
  }

  // REFACTOR: De-duplicate from BaseSimpleProject
  public async getProxyDeploymentAddress(salt: string, sender?: string): Promise<string> {
    const proxyFactory = await this.ensureProxyFactory();
    return proxyFactory.getDeploymentAddress(salt, sender);
  }

  // REFACTOR: De-duplicate from BaseSimpleProject
  public async getProxyDeploymentSigner(
    contract,
    salt: string,
    signature: string,
    { packageName, contractName, initMethod, initArgs, admin }: ContractInterface = {},
  ): Promise<string> {
    const proxyFactory = await this.ensureProxyFactory();
    const implementationAddress = await this.getImplementation({
      packageName,
      contractName,
      contract,
    });
    if (!implementationAddress)
      throw new Error(
        `Contract ${contractName ||
          contract.schema.contractName} was not found or is not deployed in the current network.`,
      );
    const adminAddress = admin || (await this.getAdminAddress());
    const initData = initMethod ? buildCallData(contract, initMethod, initArgs).callData : null;
    return proxyFactory.getSigner(salt, implementationAddress, adminAddress, initData, signature);
  }

  public async upgradeProxy(
    proxyAddress: string,
    contract: Contract,
    contractInterface: ContractInterface = {},
  ): Promise<Contract> {
    const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
    const implementationAddress = await this.getImplementation({
      packageName,
      contractName,
    });
    return this.proxyAdmin.upgradeProxy(proxyAddress, implementationAddress, contract, initMethod, initArgs);
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
  protected getAndLogInitCallData(
    contract: Contract,
    initMethodName?: string,
    initArgs?: string[],
    implementationAddress?: string,
    actionLabel?: string,
    proxyAddress?: string,
  ): string | null {
    const logReference = actionLabel === 'Creating' ? 'create-proxy' : `upgrade-proxy-${proxyAddress}`;
    const logMessage =
      actionLabel === 'Creating'
        ? `Creating instance for contract at ${implementationAddress}`
        : `Upgrading instance at ${proxyAddress}`;
    if (initMethodName) {
      const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
      if (actionLabel)
        Loggy.spin(
          __filename,
          'getAndLogInitCallData',
          logReference,
          `${logMessage} and calling ${callDescription(initMethod, initArgs)}`,
        );
      return callData;
    } else {
      if (actionLabel) {
        Loggy.spin(__filename, 'getAndLogInitCallData', logReference, logMessage);
      }
      return null;
    }
  }
}
// Mixings produce value but not type
// We have to export full class with type & callable
export default class AppProject extends ProxyAdminProjectMixin(BaseAppProject) {}
