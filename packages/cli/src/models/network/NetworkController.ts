import fs from 'fs-extra';
import isEmpty from 'lodash.isempty';
import intersection from 'lodash.intersection';
import difference from 'lodash.difference';
import uniq from 'lodash.uniq';
import filter from 'lodash.filter';
import every from 'lodash.every';
import partition from 'lodash.partition';
import map from 'lodash.map';
import concat from 'lodash.concat';
import toPairs from 'lodash.topairs';
import toposort from 'toposort';

import {
  Contracts,
  Contract,
  Loggy,
  Proxy,
  Transactions,
  semanticVersionToString,
  contractMethodsFromAbi,
  ProxyAdminProject,
  AppProject,
  flattenSourceCode,
  getStorageLayout,
  BuildArtifacts,
  getBuildArtifacts,
  getSolidityLibNames,
  validate,
  newValidationErrors,
  validationPasses,
  App,
  ZWeb3,
  TxParams,
  ProxyAdmin,
  SimpleProject,
  AppProxyMigrator,
  MinimalProxy,
  bytecodeDigest,
} from '@openzeppelin/upgrades';

import { isMigratableManifestVersion } from '../files/ManifestVersion';
import { allPromisesOrError } from '../../utils/async';
import { toContractFullName } from '../../utils/naming';
import { AppProjectDeployer, ProxyAdminProjectDeployer } from './ProjectDeployer';
import Dependency from '../dependency/Dependency';
import ValidationLogger from '../../interface/ValidationLogger';
import Verifier from '../Verifier';
import LocalController from '../local/LocalController';
import ContractManager from '../local/ContractManager';
import NetworkFile, { ProxyInterface } from '../files/NetworkFile';
import ProjectFile from '../files/ProjectFile';
import { MANIFEST_VERSION } from '../files/ManifestVersion';
import { ProxyType } from '../../scripts/interfaces';

type Project = ProxyAdminProject | AppProject;
type ProjectDeployer = ProxyAdminProjectDeployer | AppProjectDeployer;

export default class NetworkController {
  public localController: LocalController;
  public txParams: TxParams;
  public network: string;
  public networkFile: NetworkFile;
  public project: Project;
  public contractManager: ContractManager;

  public constructor(network: string, txParams: TxParams, networkFile?: NetworkFile) {
    if (!networkFile) {
      const projectFile = new ProjectFile();
      this.networkFile = new NetworkFile(projectFile, network);
    } else {
      this.networkFile = networkFile;
    }
    this.localController = new LocalController(this.networkFile.projectFile);
    this.contractManager = new ContractManager(this.networkFile.projectFile);
    this.txParams = txParams;
    this.network = network;
  }

  // NetworkController
  public get projectFile(): ProjectFile {
    return this.localController.projectFile;
  }

  // NetworkController
  public get projectVersion(): string {
    return this.projectFile.version;
  }

  // NetworkController
  public get currentVersion(): string {
    return this.networkFile.version;
  }

  public get currentManifestVersion(): string {
    return this.networkFile.manifestVersion;
  }

  // NetworkController
  public get packageAddress(): string {
    return this.networkFile.packageAddress;
  }

  public get proxyAdminAddress(): string {
    return this.networkFile.proxyAdminAddress;
  }

  public get proxyFactoryAddress(): string {
    return this.networkFile.proxyFactoryAddress;
  }

  // NetworkController
  public checkNotFrozen(): void | never {
    if (this.networkFile.frozen) {
      throw Error(
        `Cannot modify contracts in a frozen version. Run 'openzeppelin bump' to create a new version first.`,
      );
    }
  }

  // DeployerController
  public async fetchOrDeploy(requestedVersion: string): Promise<Project> {
    this.project = await this.getDeployer(requestedVersion).fetchOrDeploy();
    return this.project;
  }

  public async deployChangedSolidityLibs(contractNames: string): Promise<void> {
    const libNames = this._getAllSolidityLibNames([contractNames]);
    const changedLibraries = this.getLibsToDeploy(libNames, true);
    await this.uploadSolidityLibs(changedLibraries);
  }

  // DeployerController
  public async push(reupload = false, force = false): Promise<void | never> {
    const changedLibraries = this._solidityLibsForPush(!reupload);
    const contracts = this._contractsListForPush(!reupload, changedLibraries);
    const buildArtifacts = getBuildArtifacts();

    // ValidateContracts also extends each contract class with validation errors and storage info
    if (!this.validateContracts(contracts, buildArtifacts) && !force) {
      throw Error(
        'One or more contracts have validation errors. Please review the items listed above and fix them, or run this command again with the --force option.',
      );
    }

    this._checkVersion();
    await this.fetchOrDeploy(this.projectVersion);
    await this.handleDependenciesLink();

    this.checkNotFrozen();
    await this.uploadSolidityLibs(changedLibraries);
    await Promise.all([this.uploadContracts(contracts), this.unsetContracts()]);

    await this._unsetSolidityLibs();

    if (isEmpty(contracts) && isEmpty(changedLibraries)) {
      Loggy.noSpin(__filename, 'push', `after-push`, `All contracts are up to date`);
    } else {
      Loggy.noSpin(__filename, 'push', `after-push`, `All contracts have been deployed`);
    }
  }

  // DeployerController
  public async deployProxyFactory(): Promise<void> {
    await this.fetchOrDeploy(this.projectVersion);
    await this.project.ensureProxyFactory();
    await this._tryRegisterProxyFactory();
  }

  // DeployerController
  public async deployProxyAdmin(): Promise<void> {
    await this.fetchOrDeploy(this.projectVersion);
    await this.project.ensureProxyAdmin();
    await this._tryRegisterProxyAdmin();
  }

  // DeployerController
  private _checkVersion(): void {
    if (this._newVersionRequired()) {
      this.networkFile.frozen = false;
      this.networkFile.contracts = {};
    }
  }

  // DeployerController
  private _newVersionRequired(): boolean {
    return this.projectVersion !== this.currentVersion && this.isPublished;
  }

  // Contract model
  private _contractsListForPush(onlyChanged = false, changedLibraries: Contract[] = []): [string, Contract][] {
    const newVersion = this._newVersionRequired();

    return toPairs(this.projectFile.contracts)
      .map(([contractAlias, contractName]): [string, Contract] => [contractAlias, Contracts.getFromLocal(contractName)])
      .filter(
        ([contractAlias, contract]) =>
          newVersion ||
          !onlyChanged ||
          this.hasContractChanged(contractAlias, contract) ||
          this._hasChangedLibraries(contract, changedLibraries),
      );
  }

  private getLibsToDeploy(libNames: string[], onlyChanged = false): Contract[] {
    return libNames
      .map(libName => Contracts.getFromLocal(libName))
      .filter(libClass => {
        const hasSolidityLib = this.networkFile.hasSolidityLib(libClass.schema.contractName);
        const hasChanged = this._hasSolidityLibChanged(libClass);
        return !hasSolidityLib || !onlyChanged || hasChanged;
      });
  }

  // Contract model || SolidityLib model
  private _solidityLibsForPush(onlyChanged = false): Contract[] | never {
    const { contractNames, contractAliases } = this.projectFile;

    const libNames = this._getAllSolidityLibNames(contractNames);

    const clashes = intersection(libNames, contractAliases);
    if (!isEmpty(clashes)) {
      throw new Error(`Cannot upload libraries with the same name as a contract alias: ${clashes.join(', ')}`);
    }

    return this.getLibsToDeploy(libNames, onlyChanged);
  }

  // Contract model || SolidityLib model
  public async uploadSolidityLibs(libs: Contract[]): Promise<void> {
    // Libs may have dependencies, so deploy them in order
    for (let i = 0; i < libs.length; i++) {
      await this._uploadSolidityLib(libs[i]);
    }
  }

  // Contract model || SolidityLib model
  private async _uploadSolidityLib(libClass: Contract): Promise<void> {
    const libName = libClass.schema.contractName;
    await this._setSolidityLibs(libClass); // Libraries may depend on other libraries themselves
    Loggy.spin(__filename, '_uploadSolidityLib', `upload-solidity-lib${libName}`, `Uploading ${libName} library`);

    const libInstance =
      this.project === undefined
        ? // There is no project for non-upgradeable deploys.
          await Transactions.deployContract(libClass)
        : await this.project.setImplementation(libClass, libName);

    this.networkFile.addSolidityLib(libName, libInstance);

    Loggy.succeed(`upload-solidity-lib${libName}`, `${libName} library uploaded`);
  }

  // Contract model
  public async uploadContracts(contracts: [string, Contract][]): Promise<void> {
    await allPromisesOrError(
      contracts.map(([contractAlias, contract]) => this.uploadContract(contractAlias, contract)),
    );
  }

  // Contract model
  public async uploadContract(contractAlias: string, contract: Contract): Promise<void | never> {
    try {
      await this._setSolidityLibs(contract);
      Loggy.spin(
        __filename,
        'uploadContract',
        `upload-contract${contract.schema.contractName}`,
        `Validating and deploying contract ${contract.schema.contractName}`,
      );
      const contractInstance = await this.project.setImplementation(contract, contractAlias);
      const { types, storage } = contract.schema.storageInfo || {
        types: null,
        storage: null,
      };
      this.networkFile.addContract(contractAlias, contractInstance, {
        warnings: contract.schema.warnings,
        types,
        storage,
      });

      Loggy.succeed(
        `upload-contract${contract.schema.contractName}`,
        `Contract ${contract.schema.contractName} deployed`,
      );
    } catch (error) {
      error.message = `${contractAlias} deployment failed with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model || SolidityLib model
  private async _setSolidityLibs(contract: Contract): Promise<void> {
    const currentContractLibs = getSolidityLibNames(contract.schema.bytecode);
    const libraries = this.networkFile.getSolidityLibs(currentContractLibs);
    contract.link(libraries);
  }

  // Contract model || SolidityLib model
  private async _unsetSolidityLibs(): Promise<void> {
    const { contractNames } = this.projectFile;
    const libNames = this._getAllSolidityLibNames(contractNames);
    await allPromisesOrError(
      this.networkFile.solidityLibsMissing(libNames).map(libName => this._unsetSolidityLib(libName)),
    );
  }

  // Contract model || SolidityLib model
  private async _unsetSolidityLib(libName: string): Promise<void | never> {
    try {
      Loggy.spin(__filename, '_unsetSolidityLib', `unset-solidity-lib-${libName}`, `Removing ${libName} library`);
      // There is no project for non-upgradeable deploys.
      if (this.project !== undefined) {
        await this.project.unsetImplementation(libName);
      }
      this.networkFile.unsetSolidityLib(libName);
      Loggy.succeed(`unset-solidity-lib-${libName}`);
    } catch (error) {
      error.message = `Removal of ${libName} failed with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model || SolidityLib model
  private _hasChangedLibraries(contract: Contract, changedLibraries: Contract[]): boolean {
    const libNames = getSolidityLibNames(contract.schema.bytecode);
    return !isEmpty(
      intersection(
        changedLibraries.map(c => c.schema.contractName),
        libNames,
      ),
    );
  }

  // Contract model || SolidityLib model
  private _getAllSolidityLibNames(contractNames: string[]): string[] {
    const graph: string[][] = [];
    const nodes: string[] = [];

    contractNames.forEach(contractName => {
      this._populateDependencyGraph(contractName, nodes, graph);
    });

    // exclude original contracts
    return [...difference(toposort(graph), contractNames).reverse()];
  }

  private _populateDependencyGraph(contractName: string, nodes: string[], graph: string[][]) {
    // if library is already added just ingore it
    if (!nodes.includes(contractName)) {
      nodes.push(contractName);
      this._getContractDependencies(contractName).forEach(dependencyContractName => {
        this._populateDependencyGraph(dependencyContractName, nodes, graph);
        graph.push([contractName, dependencyContractName]);
      });
    }
  }

  private _getContractDependencies(contractName: string): string[] {
    const contract = Contracts.getFromLocal(contractName);
    return getSolidityLibNames(contract.schema.bytecode);
  }

  // Contract model
  public async unsetContracts(): Promise<void> {
    await allPromisesOrError(
      this.networkFile.contractAliasesMissingFromPackage().map(contractAlias => this.unsetContract(contractAlias)),
    );
  }

  // Contract model
  public async unsetContract(contractAlias: string): Promise<void | never> {
    try {
      Loggy.spin(__filename, 'unsetContract', `unset-contract-${contractAlias}`, `Removing ${contractAlias} contract`);
      await this.project.unsetImplementation(contractAlias);
      this.networkFile.unsetContract(contractAlias);
      Loggy.succeed(`unset-contract-${contractAlias}`);
    } catch (error) {
      error.message = `Removal of ${contractAlias} failed with error: ${error.message}`;
      throw error;
    }
  }

  // DeployerController || Contract model
  public validateContracts(contracts: [string, Contract][], buildArtifacts: BuildArtifacts): boolean {
    return every(
      contracts.map(([contractAlias, contract]) => this.validateContract(contractAlias, contract, buildArtifacts)),
    );
  }

  // DeployerController || Contract model
  public validateContract(contractAlias: string, contract: Contract, buildArtifacts: BuildArtifacts): boolean {
    try {
      const existingContractInfo: any = this.networkFile.contract(contractAlias) || {};
      const warnings = validate(contract, existingContractInfo, buildArtifacts);
      const newWarnings = newValidationErrors(warnings, existingContractInfo.warnings);

      const validationLogger = new ValidationLogger(contract, existingContractInfo);
      validationLogger.log(newWarnings, buildArtifacts);

      contract.schema.warnings = warnings;
      contract.schema.storageInfo = getStorageLayout(contract, buildArtifacts);
      return validationPasses(newWarnings);
    } catch (err) {
      Loggy.noSpin.error(
        __filename,
        'validateContract',
        `validate-contract`,
        `Error while validating contract ${contract.schema.contractName}: ${err}`,
      );
      return false;
    }
  }

  // Contract model
  public checkContractDeployed(packageName: string, contractAlias: string, throwIfFail = false): void {
    if (!packageName) packageName = this.projectFile.name;
    const err = this._errorForContractDeployed(packageName, contractAlias);
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  // Contract model
  public checkLocalContractsDeployed(throwIfFail = false): void {
    const err = this._errorForLocalContractsDeployed();
    if (err) this._handleErrorMessage(err, throwIfFail);
  }

  // Contract model
  private _errorForLocalContractsDeployed(): string {
    const [contractsDeployed, contractsMissing] = partition(this.projectFile.contractAliases, alias =>
      this.isContractDeployed(alias),
    );
    const contractsChanged = filter(contractsDeployed, alias => this.hasContractChanged(alias));

    if (!isEmpty(contractsMissing)) {
      return `Contracts ${contractsMissing.join(', ')} are not deployed.`;
    } else if (!isEmpty(contractsChanged)) {
      return `Contracts ${contractsChanged.join(', ')} have changed since the last deploy.`;
    }
  }

  // Contract model
  public checkLocalContractDeployed(contractAlias: string, throwIfFail = false): void {
    // if (!packageName) packageName = this.projectFile.name
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
      return `Contract ${contractAlias} has changed locally since the last deploy, consider running 'openzeppelin push'.`;
    }
  }

  // TODO: move to utils folder or somewhere else
  private _handleErrorMessage(msg: string, throwIfFail = false): void | never {
    if (throwIfFail) {
      throw Error(msg);
    } else {
      Loggy.noSpin(__filename, 'handleErrorMessage', `handle-error-message`, msg);
    }
  }

  // Contract model || SolidityLib model
  private _hasSolidityLibChanged(libClass: Contract): boolean {
    return !this.networkFile.hasSameBytecode(libClass.schema.contractName, libClass);
  }

  // Contract model
  public hasContractChanged(contractAlias: string, contract?: Contract): boolean {
    if (!this.isLocalContract(contractAlias)) return false;
    if (!this.isContractDeployed(contractAlias)) return true;

    if (!contract) {
      const contractName = this.projectFile.contract(contractAlias);
      contract = Contracts.getFromLocal(contractName);
    }
    return !this.networkFile.hasSameBytecode(contractAlias, contract);
  }

  // Contract model
  public isLocalContract(contractAlias: string): boolean {
    return this.projectFile.hasContract(contractAlias);
  }

  // Contract model
  public isContractDefined(contractAlias: string): boolean {
    return this.projectFile.hasContract(contractAlias);
  }

  // Contract model
  public isContractDeployed(contractAlias: string): boolean {
    return !this.isLocalContract(contractAlias) || this.networkFile.hasContract(contractAlias);
  }

  // VerifierController
  public async verifyAndPublishContract(
    contractAlias: string,
    optimizer: boolean,
    optimizerRuns: string,
    remote: string,
    apiKey: string,
  ): Promise<void> {
    Loggy.spin(
      __filename,
      'verifyAndPublishContract',
      'verify-and-publish',
      `Verifying and publishing contract source code of ${contractAlias} on ${remote} (this usually takes under 30 seconds)`,
    );
    const contractName = this.projectFile.contract(contractAlias);
    const { compilerVersion, sourcePath } = this.localController.getContractSourcePath(contractAlias);
    const contractSource = await flattenSourceCode([sourcePath]);
    const contractAddress = this.networkFile.contracts[contractAlias].address;
    await Verifier.verifyAndPublish(remote, {
      contractName,
      compilerVersion,
      optimizer,
      optimizerRuns,
      contractSource,
      contractAddress,
      apiKey,
      network: this.network,
    });
  }

  // NetworkController
  public writeNetworkPackageIfNeeded(): void {
    this.networkFile.write();
    this.projectFile.write();
  }

  // DeployerController
  public async freeze(): Promise<void | never> {
    if (!this.packageAddress) throw Error('Cannot freeze an unpublished project');
    await this.fetchOrDeploy(this.currentVersion);
    if (this.project instanceof AppProject) await this.project.freeze();
    this.networkFile.frozen = true;
  }

  // DeployerController
  public get isPublished(): boolean {
    return this.projectFile.isPublished || this.appAddress !== undefined;
  }

  // DeployerController
  public getDeployer(requestedVersion: string): ProjectDeployer {
    return this.isPublished
      ? new AppProjectDeployer(this, requestedVersion)
      : new ProxyAdminProjectDeployer(this, requestedVersion);
  }

  // NetworkController
  public get appAddress(): string {
    return this.networkFile.appAddress;
  }

  // NetworkController
  public get app(): App | null {
    if (this.project instanceof AppProject) return this.project.getApp();
    else return null;
  }

  private async _migrate(): Promise<void> {
    const owner = this.isPublished ? this.appAddress : this.txParams.from;
    const proxies = this._fetchOwnedProxies(null, null, null, owner);
    if (proxies.length !== 0) {
      const proxyAdmin = this.proxyAdminAddress
        ? await ProxyAdmin.fetch(this.proxyAdminAddress, this.txParams)
        : await ProxyAdmin.deploy(this.txParams);
      if (!this.proxyAdminAddress) {
        Loggy.spin(
          __filename,
          'fetchOrDeploy',
          'await-confirmations',
          'Awaiting confirmations before transferring proxies to ProxyAdmin (this may take a few minutes)',
        );
        await Transactions.awaitConfirmations(proxyAdmin.contract.deployment.transactionHash);
        Loggy.succeed('await-confirmations');
      }
      this._tryRegisterProxyAdmin(proxyAdmin.address);
      await allPromisesOrError(
        map(proxies, async proxy => {
          const proxyInstance = await Proxy.at(proxy.address);
          const currentAdmin = await proxyInstance.admin();
          if (currentAdmin !== proxyAdmin.address) {
            if (this.appAddress) {
              return AppProxyMigrator(this.appAddress, proxy.address, proxyAdmin.address, this.txParams);
            } else {
              const simpleProject = new SimpleProject(this.projectFile.name, null, this.txParams);
              return simpleProject.changeProxyAdmin(proxy.address, proxyAdmin.address);
            }
          }
        }),
      );
      Loggy.noSpin(
        __filename,
        '_migrate',
        'migrate-version-cli',
        `Successfully migrated to manifest version ${MANIFEST_VERSION}`,
      );
    } else {
      Loggy.noSpin(
        __filename,
        '_migrate',
        'migrate-version-cli',
        `No proxies were found. Updating manifest version to ${MANIFEST_VERSION}`,
      );
    }
  }

  private async migrateManifestVersionIfNeeded(): Promise<void> {
    if (isMigratableManifestVersion(this.currentManifestVersion)) await this._migrate();
    this.updateManifestVersionsIfNeeded(MANIFEST_VERSION);
  }

  // DeployerController
  public async publish(): Promise<void> {
    if (this.appAddress) {
      Loggy.noSpin(__filename, 'publish', 'publish-project', `Project is already published to ${this.network}`);
      return;
    }

    await this.migrateManifestVersionIfNeeded();
    const proxyAdminProject = (await this.fetchOrDeploy(this.currentVersion)) as ProxyAdminProject;
    const deployer = new AppProjectDeployer(this, this.projectVersion);
    this.project = await deployer.fromProxyAdminProject(proxyAdminProject);
    Loggy.succeed(`publish-project`, `Published to ${this.network}!`);
  }

  // Proxy model
  public async createProxy(
    packageName: string,
    contractAlias: string,
    initMethod: string,
    initArgs: string[],
    admin?: string,
    salt?: string,
    signature?: string,
    kind?: ProxyType,
  ): Promise<Contract> {
    try {
      await this.migrateManifestVersionIfNeeded();
      await this.fetchOrDeploy(this.currentVersion);
      if (!packageName) packageName = this.projectFile.name;
      const contract = this.contractManager.getContractClass(packageName, contractAlias);
      await this._setSolidityLibs(contract);
      this.checkInitialization(contract, initMethod);
      if (salt) await this._checkDeploymentAddress(salt);

      const createArgs = {
        packageName,
        contractName: contractAlias,
        initMethod,
        initArgs,
        admin,
      };
      const { proxy, instance } = await this.createProxyInstance(kind, salt, contract, signature, createArgs);

      const implementationAddress = await proxy.implementation();
      const projectVersion =
        packageName === this.projectFile.name
          ? this.currentVersion
          : await this.project.getDependencyVersion(packageName);
      await this._updateTruffleDeployedInformation(contractAlias, instance);
      this.networkFile.addProxy(packageName, contractAlias, {
        address: instance.address,
        version: semanticVersionToString(projectVersion),
        implementation: implementationAddress,
        admin: admin || this.networkFile.proxyAdminAddress || (await this.project.getAdminAddress()),
        kind,
      });
      return instance;
    } finally {
      await this._tryRegisterProxyAdmin();
      await this._tryRegisterProxyFactory();
    }
  }

  public async createInstance(packageName: string, contractAlias: string, initArgs: unknown[]): Promise<Contract> {
    await this.migrateManifestVersionIfNeeded();

    if (!packageName) {
      packageName = this.projectFile.name;
    }

    if (packageName === this.projectFile.name) {
      await this.deployChangedSolidityLibs(contractAlias);
    }

    const contract = this.contractManager.getContractClass(packageName, contractAlias);
    await this._setSolidityLibs(contract);

    const instance = await Transactions.deployContract(contract, initArgs, this.txParams);

    if (packageName === this.projectFile.name) {
      await this._updateTruffleDeployedInformation(contractAlias, instance);
    }

    this.networkFile.addProxy(packageName, contractAlias, {
      address: instance.address,
      kind: ProxyType.NonProxy,
      bytecodeHash: bytecodeDigest(contract.schema.bytecode),
    });

    return instance;
  }

  private async createProxyInstance(
    kind: ProxyType,
    salt: string,
    contract: Contract,
    signature: string,
    createArgs: {
      packageName: string;
      contractName: string;
      initMethod: string;
      initArgs: string[];
      admin: string;
    },
  ): Promise<{ instance: Contract; proxy: Proxy | MinimalProxy }> {
    let instance: Contract, proxy: Proxy | MinimalProxy;
    switch (kind) {
      case ProxyType.Upgradeable:
        instance = salt
          ? await this.project.createProxyWithSalt(contract, salt, signature, createArgs)
          : await this.project.createProxy(contract, createArgs);
        proxy = await Proxy.at(instance.address);
        break;

      case ProxyType.Minimal:
        if (salt) {
          throw new Error(
            `Cannot create a minimal proxy with a precomputed address, use an Upgradeable proxy instead.`,
          );
        }
        instance = await this.project.createMinimalProxy(contract, createArgs);
        proxy = await MinimalProxy.at(instance.address);
        break;

      default:
        throw new Error(`Unknown proxy type ${kind}`);
    }

    return { proxy, instance };
  }

  public async getProxyDeploymentAddress(salt: string, sender?: string): Promise<string> {
    await this.migrateManifestVersionIfNeeded();
    await this.fetchOrDeploy(this.currentVersion);
    const address = await this.project.getProxyDeploymentAddress(salt, sender);
    this._tryRegisterProxyFactory();

    return address;
  }

  public async getProxySignedDeployment(
    salt: string,
    signature: string,
    packageName: string,
    contractAlias: string,
    initMethod?: string,
    initArgs?: string[],
    admin?: string,
  ): Promise<{ address: string; signer: string }> {
    await this.migrateManifestVersionIfNeeded();
    await this.fetchOrDeploy(this.currentVersion);
    if (!packageName) packageName = this.projectFile.name;
    const contract = this.contractManager.getContractClass(packageName, contractAlias);
    const args = {
      packageName,
      contractName: contractAlias,
      initMethod,
      initArgs,
      admin,
    };
    const signer = await this.project.getProxyDeploymentSigner(contract, salt, signature, args);
    const address = await this.project.getProxyDeploymentAddress(salt, signer);
    this._tryRegisterProxyFactory();

    return { address, signer };
  }

  // Proxy model
  private async _checkDeploymentAddress(salt: string) {
    const deploymentAddress = await this.getProxyDeploymentAddress(salt);
    if ((await ZWeb3.eth.getCode(deploymentAddress)) !== '0x')
      throw new Error(`Deployment address for salt ${salt} is already in use`);
  }

  // Proxy model
  private async _tryRegisterProxyAdmin(adminAddress?: string) {
    if (!this.networkFile.proxyAdminAddress) {
      const proxyAdminAddress = adminAddress || (await this.project.getAdminAddress());
      if (proxyAdminAddress) this.networkFile.proxyAdmin = { address: proxyAdminAddress };
    }
  }

  // Proxy model
  private async _tryRegisterProxyFactory(factoryAddress?: string) {
    if (!this.networkFile.proxyFactoryAddress) {
      const proxyFactoryAddress = factoryAddress || (this.project.proxyFactory && this.project.proxyFactory.address);
      if (proxyFactoryAddress) this.networkFile.proxyFactory = { address: proxyFactoryAddress };
    }
  }

  // Proxy model
  public checkInitialization(contract: Contract, calledInitMethod: string): void {
    // If there is an initializer called, assume it's ok
    if (calledInitMethod) return;
    // Otherwise, warn the user to invoke it
    const contractMethods = contractMethodsFromAbi(contract);
    const initializerMethods = contractMethods
      .filter(({ hasInitializer, name }) => hasInitializer || name === 'initialize')
      .map(({ name }) => name);

    if (initializerMethods.length === 0) return;
    Loggy.noSpin.warn(
      __filename,
      'validateContract',
      `validate-contract`,
      `Possible initialization method (${uniq(initializerMethods).join(
        ', ',
      )}) found in contract. Make sure you initialize your instance.`,
    );
  }

  // Proxy model
  private async _updateTruffleDeployedInformation(contractAlias: string, implementation: Contract): Promise<void> {
    const contractName = this.projectFile.normalizeContractAlias(contractAlias);
    if (contractName) {
      const path = Contracts.getLocalPath(contractName);
      const data = fs.readJsonSync(path);
      if (!data.networks) {
        data.networks = {};
      }
      const networkId = await ZWeb3.getNetwork();
      data.networks[networkId] = {
        links: {},
        events: {},
        address: implementation.address,
        // eslint-disable-next-line @typescript-eslint/camelcase
        updated_at: Date.now(),
      };
      fs.writeJsonSync(path, data, { spaces: 2 });
    }
  }

  // Proxy model
  public async setProxiesAdmin(
    packageName: string,
    contractAlias: string,
    proxyAddress: string,
    newAdmin: string,
  ): Promise<ProxyInterface[]> {
    await this.migrateManifestVersionIfNeeded();
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy(this.currentVersion);
    await this._changeProxiesAdmin(proxies, newAdmin);
    return proxies;
  }

  // Proxy model
  public async setProxyAdminOwner(newAdminOwner: string): Promise<void> {
    await this.migrateManifestVersionIfNeeded();
    await this.fetchOrDeploy(this.currentVersion);
    await this.project.transferAdminOwnership(newAdminOwner);
  }

  // Proxy model
  private async _changeProxiesAdmin(
    proxies: ProxyInterface[],
    newAdmin: string,
    project: Project = null,
  ): Promise<void> {
    if (!project) project = this.project;
    await allPromisesOrError(
      map(proxies, async aProxy => {
        await project.changeProxyAdmin(aProxy.address, newAdmin);
        this.networkFile.updateProxy(aProxy, anotherProxy => ({
          ...anotherProxy,
          admin: newAdmin,
        }));
      }),
    );
  }

  // Proxy model
  public async upgradeProxies(
    packageName: string,
    contractAlias: string,
    proxyAddress: string,
    initMethod: string,
    initArgs: string[],
  ): Promise<ProxyInterface[]> {
    await this.migrateManifestVersionIfNeeded();
    const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
    if (proxies.length === 0) return [];
    await this.fetchOrDeploy(this.currentVersion);

    // Update all out of date proxies
    await allPromisesOrError(map(proxies, proxy => this._upgradeProxy(proxy, initMethod, initArgs)));

    return proxies;
  }

  // Proxy model
  private async _upgradeProxy(proxy: ProxyInterface, initMethod: string, initArgs: string[]): Promise<void | never> {
    try {
      const name = { packageName: proxy.package, contractName: proxy.contract };
      const contract = this.contractManager.getContractClass(proxy.package, proxy.contract);
      await this._setSolidityLibs(contract);
      const currentImplementation = await Proxy.at(proxy.address).implementation();
      const contractImplementation = await this.project.getImplementation(name);
      const projectVersion =
        proxy.package === this.projectFile.name
          ? this.currentVersion
          : await this.project.getDependencyVersion(proxy.package);

      let newImplementation;
      if (currentImplementation !== contractImplementation) {
        await this.project.upgradeProxy(proxy.address, contract, {
          initMethod,
          initArgs,
          ...name,
        });
        newImplementation = contractImplementation;
      } else {
        Loggy.noSpin(
          __filename,
          '_upgradeProxy',
          `upgrade-proxy-${proxy.address}`,
          `Contract ${proxy.contract} at ${proxy.address} is up to date.`,
        );
        newImplementation = currentImplementation;
      }

      this.networkFile.updateProxy(proxy, aProxy => ({
        ...aProxy,
        implementation: newImplementation,
        version: semanticVersionToString(projectVersion),
      }));
    } catch (error) {
      error.message = `Proxy ${toContractFullName(proxy.package, proxy.contract)} at ${
        proxy.address
      } failed to upgrade with error: ${error.message}`;
      throw error;
    }
  }

  // Proxy model
  private _fetchOwnedProxies(
    packageName?: string,
    contractAlias?: string,
    proxyAddress?: string,
    ownerAddress?: string,
  ): ProxyInterface[] {
    let criteriaDescription = '';
    if (packageName || contractAlias)
      criteriaDescription += ` contract ${toContractFullName(packageName, contractAlias)}`;
    if (proxyAddress) criteriaDescription += ` address ${proxyAddress}`;

    const proxies = this.networkFile.getProxies({
      package: packageName || (contractAlias ? this.projectFile.name : undefined),
      contract: contractAlias,
      address: proxyAddress,
      kind: ProxyType.Upgradeable,
    });

    if (isEmpty(proxies)) {
      Loggy.noSpin(
        __filename,
        '_fetchOwnedProxies',
        `fetch-owned-proxies`,
        `No upgradeable contract instances that match${criteriaDescription} were found`,
      );
      return [];
    }

    const expectedOwner = ZWeb3.toChecksumAddress(ownerAddress || this.networkFile.proxyAdminAddress);
    const ownedProxies = proxies.filter(
      proxy => !proxy.admin || !expectedOwner || ZWeb3.toChecksumAddress(proxy.admin) === expectedOwner,
    );

    if (isEmpty(ownedProxies)) {
      Loggy.noSpin(
        __filename,
        '_fetchOwnedProxies',
        `fetch-owned-proxies`,
        `No contract instances that match${criteriaDescription} are owned by this project`,
      );
    }

    return ownedProxies;
  }

  // Dependency Controller
  public async deployDependencies(): Promise<void> {
    await allPromisesOrError(
      map(this.projectFile.dependencies, (version, dep) => this.deployDependencyIfNeeded(dep, version)),
    );
  }

  // DependencyController
  public async deployDependencyIfNeeded(depName: string, depVersion: string): Promise<void | never> {
    try {
      const dependency = new Dependency(depName, depVersion);
      if (dependency.isDeployedOnNetwork(this.network) || this.networkFile.dependencyHasMatchingCustomDeploy(depName))
        return;
      Loggy.spin(
        __filename,
        'deployDependencyIfNeeded',
        `deploy-dependency-${depName}`,
        `Deploying ${depName} dependency to network ${this.network}`,
      );
      const deployment = await dependency.deploy(this.txParams);

      this.networkFile.setDependency(depName, {
        package: (await deployment.getProjectPackage()).address,
        version: deployment.version,
        customDeploy: true,
      });
      Loggy.succeed(`deploy-dependency-${depName}`);
    } catch (error) {
      error.message = `Failed deployment of dependency ${depName} with error: ${error.message}`;
      throw error;
    }
  }

  // DependencyController
  public async handleDependenciesLink(): Promise<void> {
    await allPromisesOrError(
      concat(
        map(this.projectFile.dependencies, (version, dep) => this.linkDependency(dep, version)),
        map(this.networkFile.dependenciesNamesMissingFromPackage(), dep => this.unlinkDependency(dep)),
      ),
    );
  }

  // DependencyController
  public async unlinkDependency(depName: string): Promise<void | never> {
    try {
      if (await this.project.hasDependency(depName)) {
        Loggy.spin(__filename, 'unlinkDependency', `unlink-dependency-${depName}`, `Unlinking dependency ${depName}`);
        await this.project.unsetDependency(depName);
        Loggy.succeed(`unlink-dependency-${depName}`);
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
        Loggy.onVerbose(
          __filename,
          'linkDependency',
          `link-dependency-${depName}`,
          `Using custom deployment of ${depName}`,
        );
        const depInfo = this.networkFile.getDependency(depName);
        return await this.project.setDependency(depName, depInfo.package, depInfo.version);
      }

      if (!this.networkFile.dependencySatisfiesVersionRequirement(depName)) {
        const dependencyInfo = new Dependency(depName, depVersion).getNetworkFile(this.network);
        if (!dependencyInfo.packageAddress)
          throw Error(
            `Dependency '${depName}' has not been published to network '${this.network}', so it cannot be linked. Hint: you can create a custom deployment of all unpublished dependencies by running 'openzeppelin push --deploy-dependencies'.`,
          );
        Loggy.spin(
          __filename,
          'linkDependency',
          `link-dependency-${depName}`,
          `Linking dependency ${depName} ${dependencyInfo.version}`,
        );
        await this.project.setDependency(depName, dependencyInfo.packageAddress, dependencyInfo.version);
        const depInfo = {
          package: dependencyInfo.packageAddress,
          version: dependencyInfo.version,
        };
        this.networkFile.setDependency(depName, depInfo);

        Loggy.succeed(`link-dependency-${depName}`, `Linked dependency ${depName} ${dependencyInfo.version}`);
      }
    } catch (error) {
      error.message = `Failed to link dependency ${depName}@${depVersion} with error: ${error.message}`;
      throw error;
    }
  }

  // Contract model
  private _errorForContractDeployed(packageName: string, contractAlias: string): string {
    if (packageName === this.projectFile.name) {
      return this._errorForLocalContractDeployed(contractAlias);
    } else if (!this.projectFile.hasDependency(packageName)) {
      return `Dependency ${packageName} not found in project.`;
    } else if (!this.networkFile.hasDependency(packageName)) {
      return `Dependency ${packageName} has not been linked yet. Please run 'openzeppelin push'.`;
    } else if (!new Dependency(packageName).projectFile.contract(contractAlias)) {
      return `Contract ${contractAlias} is not provided by ${packageName}.`;
    }
  }

  private updateManifestVersionsIfNeeded(version): void {
    if (this.networkFile.manifestVersion !== MANIFEST_VERSION) this.networkFile.manifestVersion = version;
    if (this.projectFile.manifestVersion !== MANIFEST_VERSION) this.projectFile.manifestVersion = version;
  }
}
