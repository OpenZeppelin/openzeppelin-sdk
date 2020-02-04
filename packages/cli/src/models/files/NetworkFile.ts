import fs from 'fs-extra';
import path from 'path';
import { findIndex, isEmpty, isEqual, difference, flatMap, map, filter, find } from 'lodash';

import {
  Loggy,
  bytecodeDigest,
  bodyCode,
  constructorCode,
  semanticVersionToString,
  Contract,
} from '@openzeppelin/upgrades';
import { fromContractFullName, toContractFullName } from '../../utils/naming';
import { MANIFEST_VERSION, checkVersion } from './ManifestVersion';
import ProjectFile from './ProjectFile';
import { OPEN_ZEPPELIN_FOLDER } from '../files/constants';
import { ProxyType } from '../../scripts/interfaces';

export interface ContractInterface {
  address?: string;
  constructorCode?: string;
  localBytecodeHash?: string;
  deployedBytecodeHash?: string;
  bodyBytecodeHash?: string;
  types?: any;
  storage?: any;
  warnings?: any;
  [id: string]: any;
}

interface SolidityLibInterface {
  address: string;
  constructorCode: string;
  bodyBytecodeHash: string;
  localBytecodeHash: string;
  deployedBytecodeHash: string;
}

export interface ProxyInterface {
  alias?: string;
  package?: string;
  contract?: any;
  address?: string;
  version?: string;
  implementation?: string;
  admin?: string;
  kind?: ProxyType;
  bytecodeHash?: string; // Only used for non-proxies from regulear deploys.
}

export interface DependencyInterface {
  name?: string;
  package?: string;
  version?: string;
  customDeploy?: boolean;
}

interface AddressWrapper {
  address?: string;
}

interface NetworkFileData {
  contracts: { [contractAlias: string]: ContractInterface };
  solidityLibs: { [libAlias: string]: SolidityLibInterface };
  proxies: { [contractName: string]: ProxyInterface[] };
  manifestVersion?: string;
  zosversion?: string;
  proxyAdmin: AddressWrapper;
  proxyFactory: AddressWrapper;
  app: AddressWrapper;
  package: AddressWrapper;
  provider: AddressWrapper;
  version: string;
  frozen: boolean;
  dependencies: { [dependencyName: string]: DependencyInterface };
}

export default class NetworkFile {
  public projectFile: ProjectFile;
  public network: any;
  public filePath: string;
  public data: NetworkFileData;

  public static getManifestVersion(network: string): string | null {
    const file = fs.existsSync(`zos.${network}.json`) ? fs.readJsonSync(`zos.${network}.json`) : null;
    return file ? file.manifestVersion || file.zosversion : null;
  }

  // TS-TODO: type for network parameter (and class member too).
  public constructor(projectFile: ProjectFile, network: any, filePath: string = null) {
    this.projectFile = projectFile;
    this.network = network;

    const defaults = {
      contracts: {},
      solidityLibs: {},
      proxies: {},
      manifestVersion: MANIFEST_VERSION,
    } as any;

    this.filePath = NetworkFile.getExistingFilePath(network, process.cwd(), filePath);

    if (this.filePath) {
      try {
        this.data = fs.existsSync(this.filePath) ? fs.readJsonSync(this.filePath) : null;
      } catch (e) {
        e.message = `Failed to parse '${path.resolve(
          filePath,
        )}' file. Please make sure that ${filePath} is a valid JSON file. Details: ${e.message}.`;
        throw e;
      }
    }

    this.data = this.data || defaults;
    this.filePath = this.filePath || `${OPEN_ZEPPELIN_FOLDER}/${network}.json`;

    checkVersion(this.data.manifestVersion || this.data.zosversion, this.filePath);
  }

  public set manifestVersion(version: string) {
    if (this.data.manifestVersion) {
      this.data.manifestVersion = version;
    } else {
      this.data.zosversion = version;
    }
  }

  public get manifestVersion(): string {
    return this.data.manifestVersion || this.data.zosversion;
  }

  public set version(version: string) {
    this.data.version = version;
  }

  public get version(): string {
    return this.data.version;
  }

  public set contracts(contracts: { [contractAlias: string]: ContractInterface }) {
    this.data.contracts = contracts;
  }

  public get contracts(): { [contractAlias: string]: ContractInterface } {
    return this.data.contracts || {};
  }

  public set solidityLibs(solidityLibs: { [libAlias: string]: SolidityLibInterface }) {
    this.data.solidityLibs = solidityLibs;
  }

  public get solidityLibs(): { [libAlias: string]: SolidityLibInterface } {
    return this.data.solidityLibs || {};
  }

  public set frozen(frozen: boolean) {
    this.data.frozen = frozen;
  }

  public get frozen(): boolean {
    return this.data.frozen;
  }

  public set proxyAdmin(admin: AddressWrapper) {
    this.data.proxyAdmin = admin;
  }

  public get proxyAdmin(): AddressWrapper {
    return this.data.proxyAdmin || {};
  }

  public set proxyFactory(factory: AddressWrapper) {
    this.data.proxyFactory = factory;
  }

  public get proxyFactory(): AddressWrapper {
    return this.data.proxyFactory || {};
  }

  public set app(app: AddressWrapper) {
    this.data.app = app;
  }

  public get app(): AddressWrapper {
    return this.data.app || {};
  }

  public set provider(provider: AddressWrapper) {
    this.data.provider = provider;
  }

  public get provider(): AddressWrapper {
    return this.data.provider || {};
  }

  public set package(_package: AddressWrapper) {
    this.data.package = _package;
  }

  public get package(): AddressWrapper {
    return this.data.package || {};
  }

  public get proxyAdminAddress(): string {
    return this.proxyAdmin.address;
  }

  public get proxyFactoryAddress(): string {
    return this.proxyFactory.address;
  }

  public get appAddress(): string {
    return this.app.address;
  }

  public get packageAddress(): string {
    return this.package.address;
  }

  public get providerAddress(): string {
    return this.provider.address;
  }

  public get isPublished(): boolean {
    return this.projectFile.isPublished;
  }

  public get contractAliases(): string[] {
    return Object.keys(this.contracts);
  }

  public addSolidityLib(libName: string, instance: Contract): void {
    this.data.solidityLibs[libName] = {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      localBytecodeHash: bytecodeDigest(instance.schema.bytecode),
      deployedBytecodeHash: bytecodeDigest(instance.schema.linkedBytecode),
    };
  }

  public unsetSolidityLib(libName: string): void {
    delete this.data.solidityLibs[libName];
  }

  public setSolidityLib(alias: string, value: SolidityLibInterface): void {
    if (!this.data.solidityLibs) this.data.solidityLibs = {};
    this.data.solidityLibs[alias] = value;
  }

  public solidityLib(libName: string): SolidityLibInterface {
    return this.data.solidityLibs[libName];
  }

  public getSolidityLibs(libs: string[]): { [libAlias: string]: string } {
    const { solidityLibs } = this.data;

    return Object.keys(solidityLibs)
      .filter(libName => libs.includes(libName))
      .map(libName => ({ libName, address: solidityLibs[libName].address }))
      .reduce((someLib, currentLib) => {
        someLib[currentLib.libName] = currentLib.address;
        return someLib;
      }, {});
  }

  public hasSolidityLib(libName: string): boolean {
    return !isEmpty(this.solidityLib(libName));
  }

  public solidityLibsMissing(libs: any): string[] {
    return difference(Object.keys(this.solidityLibs), libs);
  }

  public getSolidityLibOrContract(aliasOrName: string): ContractInterface | SolidityLibInterface {
    return this.data.solidityLibs[aliasOrName] || this.data.contracts[aliasOrName];
  }

  public hasSolidityLibOrContract(aliasOrName: string): boolean {
    return this.hasSolidityLib(aliasOrName) || this.hasContract(aliasOrName);
  }

  public updateImplementation(
    aliasOrName: string,
    fn: (source: ContractInterface | SolidityLibInterface) => ContractInterface | SolidityLibInterface,
  ): void {
    if (this.hasContract(aliasOrName))
      this.data.contracts[aliasOrName] = fn(this.data.contracts[aliasOrName]) as ContractInterface;
    else if (this.hasSolidityLib(aliasOrName))
      this.data.solidityLibs[aliasOrName] = fn(this.data.solidityLibs[aliasOrName]) as SolidityLibInterface;
    else return;
  }

  public get dependencies(): { [dependencyName: string]: DependencyInterface } {
    return this.data.dependencies || {};
  }

  public get dependenciesNames(): string[] {
    return Object.keys(this.dependencies);
  }

  public getDependency(name: string): DependencyInterface | null {
    if (!this.data.dependencies) return null;
    return this.data.dependencies[name] || {};
  }

  public hasDependency(name: string): boolean {
    return !isEmpty(this.getDependency(name));
  }

  public hasDependencies(): boolean {
    return !isEmpty(this.dependencies);
  }

  public getProxies({ package: packageName, contract, address, kind }: ProxyInterface = {}): ProxyInterface[] {
    if (isEmpty(this.data.proxies)) return [];
    const allProxies = flatMap(this.data.proxies || {}, (proxiesList, fullname) =>
      map(proxiesList, proxyInfo => ({
        ...fromContractFullName(fullname),
        ...proxyInfo,
        kind: proxyInfo.kind || ProxyType.Upgradeable,
      })),
    );
    return filter(
      allProxies,
      proxy =>
        (!packageName || proxy.package === packageName) &&
        (!contract || proxy.contract === contract) &&
        (!address || proxy.address === address) &&
        (!kind || proxy.kind === kind),
    );
  }

  public getProxy(address: string): ProxyInterface {
    const allProxies = this.getProxies();
    return find(allProxies, { address });
  }

  public contract(alias: string): ContractInterface {
    return this.data.contracts[alias];
  }

  public contractAliasesMissingFromPackage(): any[] {
    return difference(this.contractAliases, this.projectFile.contractAliases);
  }

  public isCurrentVersion(version: string): boolean {
    return this.version === version;
  }

  public hasContract(alias: string): boolean {
    return !isEmpty(this.contract(alias));
  }

  public hasContracts(): boolean {
    return !isEmpty(this.data.contracts);
  }

  public hasProxies(aFilter: any = {}): boolean {
    return !isEmpty(this.getProxies(aFilter));
  }

  public hasMatchingVersion(): boolean {
    return this.projectFile.isCurrentVersion(this.version);
  }

  public dependenciesNamesMissingFromPackage(): any[] {
    return difference(this.dependenciesNames, this.projectFile.dependenciesNames);
  }

  public dependencyHasCustomDeploy(name: string): boolean {
    const dep = this.getDependency(name);
    return dep && dep.customDeploy;
  }

  public dependencySatisfiesVersionRequirement(name: string): boolean {
    const dep = this.getDependency(name);
    return dep && this.projectFile.dependencyMatches(name, dep.version);
  }

  public dependencyHasMatchingCustomDeploy(name: string): boolean {
    return this.dependencyHasCustomDeploy(name) && this.dependencySatisfiesVersionRequirement(name);
  }

  public hasSameBytecode(alias: string, klass: any): boolean {
    const contract = this.contract(alias) || this.solidityLib(alias);
    if (contract) {
      const localBytecode = contract.localBytecodeHash;
      const currentBytecode = bytecodeDigest(klass.schema.bytecode);
      return currentBytecode === localBytecode;
    }
  }

  public setDependency(name: string, { package: thepackage, version, customDeploy }: DependencyInterface = {}) {
    if (!this.data.dependencies) this.data.dependencies = {};

    const dependency = {
      package: thepackage,
      version: semanticVersionToString(version),
      customDeploy: undefined,
    };
    if (customDeploy) dependency.customDeploy = customDeploy;

    this.data.dependencies[name] = dependency;
  }

  public unsetDependency(name: string): void {
    if (!this.data.dependencies) return;
    delete this.data.dependencies[name];
  }

  public updateDependency(name: string, fn: (...args: any[]) => any): void {
    this.setDependency(name, fn(this.getDependency(name)));
  }

  public addContract(
    alias: string,
    instance: Contract,
    { warnings, types, storage }: { warnings?: any; types?: any; storage?: any } = {},
  ): void {
    this.setContract(alias, {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      localBytecodeHash: bytecodeDigest(instance.schema.bytecode),
      deployedBytecodeHash: bytecodeDigest(instance.schema.linkedBytecode),
      types,
      storage,
      warnings,
    });
  }

  public setContract(alias: string, value: ContractInterface): void {
    this.data.contracts[alias] = value;
  }

  public unsetContract(alias: string): void {
    delete this.data.contracts[alias];
  }

  public setProxies(packageName: string, alias: string, value: ProxyInterface[]): void {
    const fullname = toContractFullName(packageName, alias);
    this.data.proxies[fullname] = value;
  }

  public addProxy(thepackage: string, alias: string, info: ProxyInterface): void {
    const fullname = toContractFullName(thepackage, alias);
    if (!this.data.proxies[fullname]) this.data.proxies[fullname] = [];
    this.data.proxies[fullname].push(info);
  }

  public removeProxy(thepackage: string, alias: string, address: string): void {
    const fullname = toContractFullName(thepackage, alias);
    const index = this._indexOfProxy(fullname, address);
    if (index < 0) return;
    this.data.proxies[fullname].splice(index, 1);
    if (this._proxiesOf(fullname).length === 0) delete this.data.proxies[fullname];
  }

  public updateProxy(
    { package: proxyPackageName, contract: proxyContractName, address: proxyAddress }: ProxyInterface,
    fn: (...args: any[]) => any,
  ): void {
    const fullname = toContractFullName(proxyPackageName, proxyContractName);
    const index = this._indexOfProxy(fullname, proxyAddress);
    if (index === -1) throw Error(`Proxy ${fullname} at ${proxyAddress} not found in network file`);
    this.data.proxies[fullname][index] = fn(this.data.proxies[fullname][index]);
  }

  public _indexOfProxy(fullname: string, address: string): number {
    return findIndex(this.data.proxies[fullname], { address });
  }

  public _proxiesOf(fullname: string): ProxyInterface[] {
    return this.data.proxies[fullname] || [];
  }

  public write(): void {
    if (this.hasChanged()) {
      const exists = this.exists();
      fs.writeJsonSync(this.filePath, this.data, { spaces: 2 });
      Loggy.onVerbose(
        __filename,
        'write',
        'write-network-json',
        exists ? `Updated ${this.filePath}` : `Created ${this.filePath}`,
      );
    }
  }

  public static getExistingFilePath(network: string, dir: string = process.cwd(), ...paths: string[]): string {
    // TODO-v3: remove legacy project file support
    // Prefer the new format over the old one
    return [...paths, `${dir}/zos.${network}.json`, `${dir}/${OPEN_ZEPPELIN_FOLDER}/${network}.json`].find(
      fs.existsSync,
    );
  }

  private hasChanged(): boolean {
    const currentNetworkFile = fs.existsSync(this.filePath) ? fs.readJsonSync(this.filePath) : null;
    return !isEqual(this.data, currentNetworkFile);
  }

  private exists(): boolean {
    return fs.existsSync(this.filePath);
  }
}
