'use strict';

import _ from 'lodash';
import { Contracts, ContractFactory, Logger, FileSystem as fs, Proxy, awaitConfirmations, semanticVersionToString } from 'zos-lib';
import { SimpleProject, AppProject, flattenSourceCode, getStorageLayout, BuildArtifacts, getBuildArtifacts, getSolidityLibNames } from 'zos-lib';
import { validate, newValidationErrors, validationPasses, App, ContractWrapper } from 'zos-lib';

import { allPromisesOrError } from '../../utils/async';
import { toContractFullName } from '../../utils/naming';
import { AppProjectDeployer, SimpleProjectDeployer } from './ProjectDeployer';
import Dependency from '../dependency/Dependency';
import StatusChecker from '../status/StatusChecker';
import ValidationLogger from '../../interface/ValidationLogger';
import Verifier from '../Verifier';
import LocalController from '../local/LocalController';
import ZosNetworkFile, { ProxyInterface } from '../files/ZosNetworkFile';
import ZosPackageFile from '../files/ZosPackageFile';

const log = new Logger('NetworkAppController');

export default class NetworkController {

  public localController: LocalController;
  public txParams: any;
  public network: string;
  public networkFile: ZosNetworkFile;
  public project: SimpleProject | AppProject;

  constructor(localController: LocalController, network: string, txParams: any, networkFile?: ZosNetworkFile) {
    this.localController = localController;
    this.txParams = txParams;
    this.network = network;
    this.networkFile = networkFile || localController.packageFile.networkFile(network);
  }

  // NetworkController
  get packageFile(): ZosPackageFile {
    return this.localController.packageFile;
  }

  // NetworkController
  get packageVersion(): string {
    return this.packageFile.version;
  }

  // NetworkController
  get currentVersion(): string {
    return this.networkFile.version;
  }

  // NetworkController
  get packageAddress(): string {
    return this.networkFile.packageAddress;
  }

  // NetworkController
  public checkNotFrozen(): void | never {
    if (this.networkFile.frozen) {
      throw Error('Cannot modify contracts in a frozen version. Run zos bump to create a new version first.');
    }
  }

  // StatusController
  public async compareCurrentStatus(): Promise<void | never> {
    if (!this.isPublished) throw Error('Command status-pull is not supported for unpublished projects');
    const statusComparator = StatusChecker.compare(this.networkFile, this.txParams);
    await statusComparator.call();
  }

  // StatusController
  public async pullRemoteStatus(): Promise<void | never> {
    if (!this.isPublished) throw Error('Command status-fix is not supported for unpublished projects');
    const statusFetcher = StatusChecker.fetch(this.networkFile, this.txParams);
    await statusFetcher.call();
  }

  // DeployerController
  public async fetchOrDeploy(requestedVersion: string): Promise<SimpleProject | AppProject> {
    this.project = await this.getDeployer(requestedVersion).fetchOrDeploy();
    return this.project;
  }

  // DeployerController
  public async push(reupload: boolean = false, force: boolean = false): Promise<void | never> {
    const changedLibraries = this._solidityLibsForPush(!reupload);
    const contracts = this._contractsListForPush(!reupload, changedLibraries);
    const buildArtifacts = getBuildArtifacts();

    // ValidateContracts also extends each contract class with validation errors and storage info
    if (!this.validateContracts(contracts, buildArtifacts) && !force) {
      throw Error('One or more contracts have validation errors. Please review the items listed above and fix them, or run this command again with the --force option.');
    }

    this._checkVersion();
    await this.fetchOrDeploy(this.packageVersion);
    await this.handleDependenciesLink();

    this.checkNotFrozen();
    await this.uploadSolidityLibs(changedLibraries);
    await Promise.all([
      this.uploadContracts(contracts),
      this.unsetContracts()
    ]);

    await this._unsetSolidityLibs();
  }

  // DeployerController
  private _checkVersion(): void {
    if (this._newVersionRequired()) {
      log.info(`Current version ${this.currentVersion}`);
      log.info(`Creating new version ${this.packageVersion}`);
      this.networkFile.frozen = false;
      this.networkFile.contracts = {};
    }
  }

  // DeployerController
  private _newVersionRequired(): boolean {
    return (this.packageVersion !== this.currentVersion) && this.isPublished;
  }

  // Contract model
  private _contractsListForPush(onlyChanged: boolean = false, changedLibraries: ContractFactory[] = []): Array<[string, ContractFactory]> {
    const newVersion = this._newVersionRequired();
    return _(this.packageFile.contracts)
      .toPairs()
      .map(([contractAlias, contractName]) => [contractAlias, Contracts.getFromLocal(contractName)])
      .filter(([contractAlias, contractClass]) => newVersion || !onlyChanged || this.hasContractChanged(contractAlias, contractClass) || this._hasChangedLibraries(contractClass, changedLibraries))
      .value();
  }

  // Contract model || SolidityLib model
  private _solidityLibsForPush(onlyChanged: boolean = false): ContractFactory[] | never {
    const { contractNames, contractAliases } = this.packageFile;
    const libNames = this._getAllSolidityLibNames(contractNames);

    const clashes = _.intersection(libNames, contractAliases);
    if(!_.isEmpty(clashes)) {
      throw new Error(`Cannot upload libraries with the same name as a contract alias: ${clashes.join(', ')}`);
    }

    return libNames
      .map((libName) => Contracts.getFromLocal(libName))
      .filter((libClass) => {
        const hasSolidityLib = this.networkFile.hasSolidityLib(libClass.contractName);
        const hasChanged = this._hasSolidityLibChanged(libClass);
        return (!hasSolidityLib || !onlyChanged || hasChanged);
      });
  }

  // Contract model || SolidityLib model
  public async uploadSolidityLibs(libs: ContractFactory[]): Promise<void> {
    await allPromisesOrError(
      libs.map((lib) => this._uploadSolidityLib(lib))
    );
  }

  // Contract model || SolidityLib model
  private async _uploadSolidityLib(libClass: ContractFactory): Promise<void> {
    const libName = libClass.contractName;
    log.info(`Uploading ${libName} library...`);
    const libInstance = await this.project.setImplementation(libClass, libName);
    this.networkFile.addSolidityLib(libName, libInstance);
  }

  // Contract model
  public async uploadContracts(contracts: Array<[string, ContractFactory]>): Promise<void> {
    await allPromisesOrError(
      contracts.map(
        ([contractAlias, contractClass]) => this.uploadContract(contractAlias, contractClass)
      )
    );
  }

  // Contract model
  public async uploadContract(contractAlias: string, contractClass: ContractFactory): Promise<void | never> {
    try {
      const currentContractLibs = getSolidityLibNames(contractClass.bytecode);
      const libraries = this.networkFile.getSolidityLibs(currentContractLibs);
      log.info(`Uploading ${contractClass.contractName} contract as ${contractAlias}`);
      await contractClass.link(libraries);
      const contractInstance = await this.project.setImplementation(contractClass, contractAlias);
      this.networkFile.addContract(contractAlias, contractInstance, {
        warnings: contractClass.warnings,
        types: contractClass.storageInfo.types,
        storage: contractClass.storageInfo.storage
      });
    } catch(error) {
      error.message = `${contractAlias} deployment failed with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model || SolidityLib model
  private async _unsetSolidityLibs(): Promise<void> {
    const { contractNames } = this.packageFile;
    const libNames = this._getAllSolidityLibNames(contractNames);
    await allPromisesOrError(
      this.networkFile.solidityLibsMissing(libNames).map((libName) => this._unsetSolidityLib(libName))
    );
  }

  // Contract model || SolidityLib model
  private async _unsetSolidityLib(libName: string): Promise<void | never> {
    try {
      log.info(`Removing ${libName} library`);
      await this.project.unsetImplementation(libName);
      this.networkFile.unsetSolidityLib(libName);
    } catch(error) {
      error.message = `Removal of ${libName} failed with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model || SolidityLib model
  private _hasChangedLibraries(contractClass: ContractFactory, changedLibraries: ContractFactory[]): boolean {
    const libNames = getSolidityLibNames(contractClass.bytecode);
    return !_.isEmpty(_.intersection(changedLibraries.map((c) => c.contractName), libNames));
  }

  // Contract model || SolidityLib model
  private _getAllSolidityLibNames(contractNames: string[]): string[] {
    const libNames = contractNames.map((contractName) => {
      const contractClass = Contracts.getFromLocal(contractName);
      return getSolidityLibNames(contractClass.bytecode);
    });

    return _.uniq(_.flatten(libNames));
  }

  // Contract model
  public async unsetContracts(): Promise<void> {
    await allPromisesOrError(
      this.networkFile.contractAliasesMissingFromPackage().map((contractAlias) => this.unsetContract(contractAlias))
    );
  }

  // Contract model
  public async unsetContract(contractAlias: string): Promise<void | never> {
    try {
      log.info(`Removing ${contractAlias} contract`);
      await this.project.unsetImplementation(contractAlias);
      this.networkFile.unsetContract(contractAlias);
    } catch(error) {
      error.message = `Removal of ${contractAlias} failed with error: ${error.message}`;
      throw error;
    }
  }

  // DeployerController || Contract model
  public validateContracts(contracts: Array<[string, ContractFactory]>, buildArtifacts: BuildArtifacts): boolean {
    return _.every(contracts.map(([contractAlias, contractClass]) =>
      this.validateContract(contractAlias, contractClass, buildArtifacts))
    );
  }

  // DeployerController || Contract model
  public validateContract(contractAlias: string, contractClass: ContractFactory, buildArtifacts: BuildArtifacts): boolean {
    log.info(`Validating contract ${contractClass.contractName}`);
    const existingContractInfo: any = this.networkFile.contract(contractAlias) || {};
    const warnings = validate(contractClass, existingContractInfo, buildArtifacts);
    const newWarnings = newValidationErrors(warnings, existingContractInfo.warnings);

    const validationLogger = new ValidationLogger(contractClass, existingContractInfo);
    validationLogger.log(newWarnings, buildArtifacts);

    contractClass.warnings = warnings;
    contractClass.storageInfo = getStorageLayout(contractClass, buildArtifacts);
    return validationPasses(newWarnings);
  }

  // Contract model
  public checkContractDeployed(packageName: string, contractAlias: string, throwIfFail: boolean = false): void {
    if (!packageName) packageName = this.packageFile.name;
    const err = this._errorForContractDeployed(packageName, contractAlias);
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  // Contract model
  public checkLocalContractsDeployed(throwIfFail: boolean = false): void {
    const err = this._errorForLocalContractsDeployed();
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  // Contract model
  private _errorForLocalContractsDeployed(): string {
    const [contractsDeployed, contractsMissing] = _.partition(this.packageFile.contractAliases, (alias) => this.isContractDeployed(alias));
    const contractsChanged = _.filter(contractsDeployed, (alias) => this.hasContractChanged(alias));

    if (!_.isEmpty(contractsMissing)) {
      return `Contracts ${contractsMissing.join(', ')} are not deployed.`;
    } else if (!_.isEmpty(contractsChanged)) {
      return `Contracts ${contractsChanged.join(', ')} have changed since the last deploy.`;
    }
  }

  // Contract model
  public checkLocalContractDeployed(contractAlias: string, throwIfFail: boolean = false): void {
    // if (!packageName) packageName = this.packageFile.name
    const err = this._errorForLocalContractDeployed(contractAlias);
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  // Contract model
  private _errorForLocalContractDeployed(contractAlias: string): string {
    if (!this.isContractDefined(contractAlias)) {
      return `Contract ${contractAlias} not found in this project`;
    } else if (!this.isContractDeployed(contractAlias)) {
      return `Contract ${contractAlias} is not deployed to ${this.network}.`;
    } else if (this.hasContractChanged(contractAlias)) {
      return `Contract ${contractAlias} has changed locally since the last deploy, consider running 'zos push'.`;
    }
  }

  // TODO: move to utils folder or somewhere else
  private _handleErrorMessage(msg: string, throwIfFail: boolean = false): void | never {
    if (throwIfFail) {
      throw Error(msg);
    } else {
      log.info(msg);
    }
  }

  // Contract model || SolidityLib model
  private _hasSolidityLibChanged(libClass: ContractFactory): boolean {
    return !this.networkFile.hasSameBytecode(libClass.contractName, libClass);
  }

  // Contract model
  public hasContractChanged(contractAlias: string, contractClass?: ContractFactory): boolean {
    if (!this.isLocalContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;

    if (!contractClass) {
      const contractName = this.packageFile.contract(contractAlias);
      contractClass = Contracts.getFromLocal(contractName);
    }
    return !this.networkFile.hasSameBytecode(contractAlias, contractClass);
  }

  // Contract model
  public isLocalContract(contractAlias: string): boolean {
    return this.packageFile.hasContract(contractAlias);
  }

  // Contract model
  public isContractDefined(contractAlias: string): boolean {
    return this.packageFile.hasContract(contractAlias);
  }

  // Contract model
  public isContractDeployed(contractAlias: string): boolean {
    return !this.isLocalContract(contractAlias) || this.networkFile.hasContract(contractAlias);
  }

  // VerifierController
  public async verifyAndPublishContract(contractAlias: string, optimizer: boolean, optimizerRuns: string, remote: string, apiKey: string): Promise<void> {
    const contractName = this.packageFile.contract(contractAlias);
    const { compilerVersion, sourcePath } = this.localController.getContractSourcePath(contractAlias);
    const contractSource = await flattenSourceCode([sourcePath]);
    const contractAddress = this.networkFile.contracts[contractAlias].address;
    log.info(`Verifying and publishing ${contractAlias} on ${remote}`);

    await Verifier.verifyAndPublish(remote, { contractName, compilerVersion, optimizer, optimizerRuns, contractSource, contractAddress, apiKey, network: this.network });
  }

  // NetworkController
  public writeNetworkPackageIfNeeded(): void {
    this.networkFile.write();
  }

  // DeployerController
  public async freeze(): Promise<void | never> {
    if (!this.packageAddress) throw Error('Cannot freeze an unpublished project');
    await this.fetchOrDeploy(this.currentVersion);
    if(this.project instanceof AppProject) await this.project.freeze();
    this.networkFile.frozen = true;
  }

  // DeployerController
  get isPublished(): boolean {
    return this.packageFile.isPublished || this.appAddress !== undefined
  }

  // DeployerController
  public getDeployer(requestedVersion: string): SimpleProjectDeployer | AppProjectDeployer {
    return this.isPublished
      ? new AppProjectDeployer(this, requestedVersion)
      : new SimpleProjectDeployer(this, requestedVersion);
  }

  // NetworkController
  get appAddress(): string {
    return this.networkFile.appAddress;
  }

  // NetworkController
  get app(): App | null {
    if(this.project instanceof AppProject) return this.project.getApp();
    else return null;
  }

  // DeployerController
  public async toFullApp(): Promise<void> {
    if (this.appAddress) {
      log.info(`Project is already published to ${this.network}`);
      return;
    }

    log.info(`Publishing project to ${this.network}...`);
    const simpleProject = <SimpleProject>(await this.fetchOrDeploy(this.currentVersion));
    const deployer = new AppProjectDeployer(this, this.packageVersion);
    this.project = await deployer.fromSimpleProject(simpleProject);
    log.info(`Publish to ${this.network} successful`);

    const proxies = this._fetchOwnedProxies();
    if (proxies.length !== 0) {
      log.info(`Awaiting confirmations before transferring proxies to published project (this may take a few minutes)`);
      const app = this.project.getApp();
      await awaitConfirmations(app.contract.transactionHash);
      await this._changeProxiesAdmin(proxies, app.address, simpleProject);
      log.info(`${proxies.length} proxies have been successfully transferred`);
    }
  }

  // Proxy model
  public async createProxy(packageName: string, contractAlias: string, initMethod: string, initArgs: string[]): Promise<ContractWrapper> {
    await this.fetchOrDeploy(this.currentVersion);
    if (!packageName) packageName = this.packageFile.name;
    const contractClass = this.localController.getContractClass(packageName, contractAlias);
    this.checkInitialization(contractClass, initMethod, initArgs);
    const proxyInstance = await this.project.createProxy(contractClass, { packageName, contractName: contractAlias, initMethod, initArgs });
    const implementationAddress = await Proxy.at(proxyInstance).implementation();
    const packageVersion = packageName === this.packageFile.name ? this.currentVersion : (await this.project.getDependencyVersion(packageName));
    this._updateTruffleDeployedInformation(contractAlias, proxyInstance);

    this.networkFile.addProxy(packageName, contractAlias, {
      address: proxyInstance.address,
      version: semanticVersionToString(packageVersion),
      implementation: implementationAddress
    });
    return proxyInstance;
  }

  // Proxy model
  public checkInitialization(contractClass: ContractFactory, calledInitMethod: string, calledInitArgs: string[]): void {
    // If there is an initializer called, assume it's ok
    if (calledInitMethod) return;

    // Otherwise, warn the user to invoke it
    const initializeMethod = contractClass.abi.find((fn) => fn.type === 'function' && fn.name === 'initialize');
    if (!initializeMethod) return;
    log.error(`Possible initialization method 'initialize' found in contract. Make sure you initialize your instance.`);
  }

  // Proxy model
  private _updateTruffleDeployedInformation(contractAlias: string, implementation: ContractWrapper): void {
    const contractName = this.packageFile.contract(contractAlias);
    if (contractName) {
      const path = Contracts.getLocalPath(contractName);
      const data = fs.parseJson(path);
      if (!data.networks) {
        data.networks = {};
      }
      data.networks[implementation.constructor.network_id] = {
        links: {},
        events: {},
        address: implementation.address,
        updated_at: Date.now()
      };
      fs.writeJson(path, data);
    }
  }

  // Proxy model
  public async setProxiesAdmin(packageName: string, contractAlias: string, proxyAddress: string, newAdmin: string): Promise<ProxyInterface[]> {
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy(this.currentVersion);
    await this._changeProxiesAdmin(proxies, newAdmin);
    return proxies;
  }

  // Proxy model
  private async _changeProxiesAdmin(proxies: ProxyInterface[], newAdmin: string, project: SimpleProject | AppProject = null): Promise<void> {
    if (!project) project = this.project;
    await allPromisesOrError(_.map(proxies, async (aProxy) => {
      await project.changeProxyAdmin(aProxy.address, newAdmin);
      this.networkFile.updateProxy(aProxy, (anotherProxy) => ({ ...anotherProxy, admin: newAdmin }));
    }));
  }

  // Proxy model
  public async upgradeProxies(packageName: string, contractAlias: string, proxyAddress: string, initMethod: string, initArgs: string[]): Promise<ProxyInterface[]> {
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy(this.currentVersion);

    // Check if there is any migrate method in the contracts and warn the user to call it
    const contracts = _.uniqWith(_.map(proxies, (p) => [p.package, p.contract]), _.isEqual);
    _.forEach(contracts, ([aPackageName, contractName]) =>
      this._checkUpgrade(this.localController.getContractClass(aPackageName, contractName), initMethod, initArgs)
    );

    // Update all proxies loaded
    await allPromisesOrError(
      _.map(proxies, (proxy) => this._upgradeProxy(proxy, initMethod, initArgs))
    );

    return proxies;
  }

  // Proxy model
  private async _upgradeProxy(proxy: ProxyInterface, initMethod: string, initArgs: string[]): Promise<void | never> {
    try {
      const name = { packageName: proxy.package, contractName: proxy.contract };
      const contractClass = this.localController.getContractClass(proxy.package, proxy.contract);
      const currentImplementation = await Proxy.at(proxy).implementation();
      const contractImplementation = await this.project.getImplementation(name);
      const packageVersion = proxy.package === this.packageFile.name ? this.currentVersion : (await this.project.getDependencyVersion(proxy.package));

      let newImplementation;
      if (currentImplementation !== contractImplementation) {
        await this.project.upgradeProxy(proxy.address, contractClass, { initMethod, initArgs, ... name });
        newImplementation = contractImplementation;
      } else {
        log.info(`Contract ${proxy.contract} at ${proxy.address} is up to date.`);
        newImplementation = currentImplementation;
      }

      this.networkFile.updateProxy(proxy, (aProxy) => ({
        ... aProxy,
        implementation: newImplementation,
        version: semanticVersionToString(packageVersion)
      }));
    } catch(error) {
      error.message = `Proxy ${toContractFullName(proxy.package, proxy.contract)} at ${proxy.address} failed to update with error: ${error.message}`;
      throw error;
    }
  }

  // Proxy model
  private _checkUpgrade(contractClass: ContractFactory, calledMigrateMethod: string, calledMigrateArgs: string[]): void {
    // If there is a migration called, assume it's ok
    if (calledMigrateMethod) return;

    // Otherwise, warn the user to invoke it
    const migrateMethod = contractClass.abi.find((fn) => fn.type === 'function' && fn.name === 'migrate');
    if (!migrateMethod) return;
    log.error(`Possible migration method 'migrate' found in contract ${contractClass.contractName}. Remember running the migration after deploying it.`);
  }

  // Proxy model
  private _fetchOwnedProxies(packageName?: string, contractAlias?: string, proxyAddress?: string): ProxyInterface[] {
    let criteriaDescription = '';
    if (packageName || contractAlias) criteriaDescription += ` contract ${toContractFullName(packageName, contractAlias)}`;
    if (proxyAddress) criteriaDescription += ` address ${proxyAddress}`;

    const proxies = this.networkFile.getProxies({
      package: packageName || (contractAlias ? this.packageFile.name : undefined),
      contract: contractAlias,
      address: proxyAddress
    });

    if (_.isEmpty(proxies)) {
      log.info(`No contract instances that match${criteriaDescription} were found`);
      return [];
    }

    // TODO: If 'from' is not explicitly set, then we need to retrieve it from the set of current accounts
    const expectedOwner = this.isPublished ? this.appAddress : this.txParams.from;
    const ownedProxies = proxies.filter((proxy) => !proxy.admin || !expectedOwner || proxy.admin === expectedOwner);

    if (_.isEmpty(ownedProxies)) {
      log.info(`No contract instances that match${criteriaDescription} are owned by this application`);
    }

    return ownedProxies;
  }

  // Dependency Controller
  public async deployDependencies(): Promise<void> {
    await allPromisesOrError(
      _.map(this.packageFile.dependencies, (version, dep) => this.deployDependencyIfNeeded(dep, version))
    );
  }

  // DependencyController
  public async deployDependencyIfNeeded(depName: string, depVersion: string): Promise<void | never> {
    try {
      const dependency = new Dependency(depName, depVersion);
      if (dependency.isDeployedOnNetwork(this.network) || this.networkFile.dependencyHasMatchingCustomDeploy(depName)) return;
      log.info(`Deploying ${depName} contracts`);
      const deployment = await dependency.deploy(this.txParams);
      this.networkFile.setDependency(depName, {
        package: (await deployment.getProjectPackage()).address,
        version: deployment.version,
        customDeploy: true
      });
    } catch (error) {
      error.message = `Failed deployment of dependency ${depName} with error: ${error.message}`;
      throw error;
    }
  }

  // DependencyController
  public async handleDependenciesLink(): Promise<void> {
    await allPromisesOrError(_.concat(
      _.map(this.packageFile.dependencies, (version, dep) => this.linkDependency(dep, version)),
      _.map(this.networkFile.dependenciesNamesMissingFromPackage(), (dep) => this.unlinkDependency(dep))
    ));
  }

  // DependencyController
  public async unlinkDependency(depName: string): Promise<void | never> {
    try {
      if (await this.project.hasDependency(depName)) {
        log.info(`Unlinking dependency ${depName}`);
        await this.project.unsetDependency(depName);
      }
      this.networkFile.unsetDependency(depName);
    } catch (error) {
      throw Error(`Failed to unlink dependency ${depName} with error: ${error.message}`);
    }
  }

  // DependencyController
  public async linkDependency(depName: string, depVersion: string): Promise<boolean | void | never> {
    try {
      if (this.networkFile.dependencyHasMatchingCustomDeploy(depName)) {
        log.info(`Using custom deployment of ${depName}`);
        const depInfo = this.networkFile.getDependency(depName);
        return await this.project.setDependency(depName, depInfo.package, depInfo.version);
      }

      if (!this.networkFile.dependencySatisfiesVersionRequirement(depName)) {
        const dependencyInfo = (new Dependency(depName, depVersion)).getNetworkFile(this.network);
        if (!dependencyInfo.packageAddress) throw Error(`Dependency '${depName}' has not been published to network '${this.network}', so it cannot be linked. Hint: you can create a custom deployment of all unpublished dependencies by running 'zos push' with the '--deploy-dependencies' option.`);
        log.info(`Connecting to dependency ${depName} ${dependencyInfo.version}`);
        await this.project.setDependency(depName, dependencyInfo.packageAddress, dependencyInfo.version);
        const depInfo = { package: dependencyInfo.packageAddress, version: dependencyInfo.version };
        this.networkFile.setDependency(depName, depInfo);
      }
    } catch(error) {
      error.message = `Failed to link dependency ${depName}@${depVersion} with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model
  private _errorForContractDeployed(packageName: string, contractAlias: string): string {
    if (packageName === this.packageFile.name) {
      return this._errorForLocalContractDeployed(contractAlias);
    } else if (!this.packageFile.hasDependency(packageName)) {
      return `Dependency ${packageName} not found in project.`;
    } else if (!this.networkFile.hasDependency(packageName)) {
      return `Dependency ${packageName} has not been linked yet. Please run zos push.`;
    } else if (!(new Dependency(packageName)).getPackageFile().contract(contractAlias)) {
      return `Contract ${contractAlias} is not provided by ${packageName}.`;
    }
  }
}
