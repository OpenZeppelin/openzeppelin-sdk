import findIndex from 'lodash.findindex';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import difference from 'lodash.difference';
import flatMap from 'lodash.flatmap';
import map from 'lodash.map';
import filter from 'lodash.filter';
import find from 'lodash.find';

import { Logger, FileSystem as fs, bytecodeDigest, bodyCode, constructorCode, semanticVersionToString, ContractWrapper } from 'zos-lib';
import { fromContractFullName, toContractFullName } from '../../utils/naming';
import { ZOS_VERSION, checkVersion } from './ZosVersion';
import ZosPackageFile from './ZosPackageFile.js';

const log = new Logger('ZosNetworkFile');

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
}

export interface DependencyInterface {
  name?: string;
  package?: string;
  version?: string;
  customDeploy?: boolean;
}

interface AddressWrapper { address?: string; }

export default class ZosNetworkFile {

  public packageFile: ZosPackageFile;
  public network: any;
  public fileName: string;
  public data: {
    contracts: { [contractAlias: string]: ContractInterface };
    solidityLibs: { [libAlias: string]: SolidityLibInterface };
    proxies: { [contractName: string]: ProxyInterface[] };
    zosversion: string;
    proxyAdmin: AddressWrapper;
    app: AddressWrapper;
    package: AddressWrapper;
    provider: AddressWrapper;
    version: string;
    frozen: boolean;
    dependencies: { [dependencyName: string]: DependencyInterface };
  };

  // TS-TODO: type for network parameter (and class member too).
  constructor(packageFile: ZosPackageFile, network: any, fileName: string) {
    this.packageFile = packageFile;
    this.network = network;
    this.fileName = fileName;

    const defaults = { contracts: {}, solidityLibs: {}, proxies: {}, zosversion: ZOS_VERSION };

    this.data = fs.parseJsonIfExists(this.fileName) || defaults;
    checkVersion(this.data.zosversion, this.fileName);
  }

  get proxyAdmin(): AddressWrapper {
    return this.data.proxyAdmin || {};
  }

  get proxyAdminAddress(): string {
    return this.proxyAdmin.address;
  }

  get app(): AddressWrapper {
    return this.data.app || {};
  }

  get appAddress(): string {
    return this.app.address;
  }

  get package(): AddressWrapper {
    return this.data.package || {};
  }

  get packageAddress(): string {
    return this.package.address;
  }

  get provider(): AddressWrapper {
    return this.data.provider || {};
  }

  get providerAddress(): string {
    return this.provider.address;
  }

  get version(): string {
    return this.data.version;
  }

  get zosversion(): string {
    return this.data.zosversion;
  }

  get frozen(): boolean {
    return this.data.frozen;
  }

  get contracts(): { [contractAlias: string]: ContractInterface } {
    return this.data.contracts || {};
  }

  get contractAliases(): string[] {
    return Object.keys(this.contracts);
  }

  get isPublished(): boolean {
    return this.packageFile.isPublished;
  }

  get solidityLibs(): { [libAlias: string]: SolidityLibInterface } {
    return this.data.solidityLibs || {};
  }

  public addSolidityLib(libName: string, instance: any): void {
    this.data.solidityLibs[libName] = {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      localBytecodeHash: bytecodeDigest(instance.constructor.bytecode),
      deployedBytecodeHash: bytecodeDigest(instance.constructor.binary)
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

    return Object
      .keys(solidityLibs)
      .filter((libName) => libs.includes(libName))
      .map((libName) => ({ libName, address: solidityLibs[libName].address }))
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

  public updateImplementation(aliasOrName: string, fn: (source: ContractInterface | SolidityLibInterface) => ContractInterface | SolidityLibInterface): void {
    if (this.hasContract(aliasOrName)) this.data.contracts[aliasOrName] = <ContractInterface>fn(this.data.contracts[aliasOrName]);
    else if (this.hasSolidityLib(aliasOrName)) this.data.solidityLibs[aliasOrName] = <SolidityLibInterface>fn(this.data.solidityLibs[aliasOrName]);
    else return;
  }

  get dependencies(): { [dependencyName: string]: DependencyInterface } {
    return this.data.dependencies || {};
  }

  get dependenciesNames(): string[] {
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

  public getProxies({ package: packageName, contract, address }: ProxyInterface = {}): ProxyInterface[] {
    if (isEmpty(this.data.proxies)) return [];
    const allProxies = flatMap(this.data.proxies || {}, (proxiesList, fullname) => (
      map(proxiesList, (proxyInfo) => ({
        ...fromContractFullName(fullname),
        ...proxyInfo
      }))
    ));
    return filter(allProxies, (proxy) => (
      (!packageName || proxy.package === packageName) &&
      (!contract || proxy.contract === contract) &&
      (!address || proxy.address === address)
    ));
  }

  public getProxy(address: string): ProxyInterface {
    const allProxies = this.getProxies();
    return find(allProxies, { address });
  }

  public contract(alias: string): ContractInterface {
    return this.data.contracts[alias];
  }

  public contractAliasesMissingFromPackage(): any[] {
    return difference(this.contractAliases, this.packageFile.contractAliases);
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
    return this.packageFile.isCurrentVersion(this.version);
  }

  public dependenciesNamesMissingFromPackage(): any[] {
    return difference(this.dependenciesNames, this.packageFile.dependenciesNames);
  }

  public dependencyHasCustomDeploy(name: string): boolean {
    const dep = this.getDependency(name);
    return dep && dep.customDeploy;
  }

  public dependencySatisfiesVersionRequirement(name: string): boolean {
    const dep = this.getDependency(name);
    return dep && this.packageFile.dependencyMatches(name, dep.version);
  }

  public dependencyHasMatchingCustomDeploy(name: string): boolean {
    return this.dependencyHasCustomDeploy(name) && this.dependencySatisfiesVersionRequirement(name);
  }

  public hasSameBytecode(alias: string, klass: any): boolean {
    const contract = this.contract(alias) || this.solidityLib(alias);
    if (contract) {
      const localBytecode = contract.localBytecodeHash;
      const currentBytecode = bytecodeDigest(klass.bytecode);
      return currentBytecode === localBytecode;
    }
  }

  set zosversion(version: string) {
    this.data.zosversion = version;
  }

  set version(version: string) {
    this.data.version = version;
  }

  set contracts(contracts: { [contractAlias: string]: ContractInterface }) {
    this.data.contracts = contracts;
  }

  set solidityLibs(solidityLibs: { [libAlias: string]: SolidityLibInterface }) {
    this.data.solidityLibs = solidityLibs;
  }

  set frozen(frozen: boolean) {
    this.data.frozen = frozen;
  }

  set proxyAdmin(admin: AddressWrapper) {
    this.data.proxyAdmin = admin;

  }

  set app(app: AddressWrapper) {
    this.data.app = app;
  }

  set provider(provider: AddressWrapper) {
    this.data.provider = provider;
  }

  set package(_package: AddressWrapper) {
    this.data.package = _package;
  }

  public setDependency(name: string, { package: thepackage, version, customDeploy }: DependencyInterface = {}) {
    if (!this.data.dependencies) this.data.dependencies = {};

    const dependency = {
      package: thepackage,
      version: semanticVersionToString(version),
      customDeploy: undefined
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

  // TS-TODO: instance can probably be typed to something interesting.
  public addContract(alias: string, instance: any, { warnings, types, storage }: { warnings?: any, types?: any, storage?: any } = {}): void {
    this.setContract(alias, {
      address: instance.address,
      constructorCode: constructorCode(instance),
      bodyBytecodeHash: bytecodeDigest(bodyCode(instance)),
      localBytecodeHash: bytecodeDigest(instance.constructor.bytecode),
      deployedBytecodeHash: bytecodeDigest(instance.constructor.binary),
      types,
      storage,
      warnings
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
    if(!this.data.proxies[fullname]) this.data.proxies[fullname] = [];
    this.data.proxies[fullname].push(info);
  }

  public removeProxy(thepackage: string, alias: string, address: string): void {
    const fullname = toContractFullName(thepackage, alias);
    const index = this._indexOfProxy(fullname, address);
    if(index < 0) return;
    this.data.proxies[fullname].splice(index, 1);
    if(this._proxiesOf(fullname).length === 0) delete this.data.proxies[fullname];
  }

  public updateProxy(
    { package: proxyPackageName, contract: proxyContractName, address: proxyAddress }: ProxyInterface,
    fn: (...args: any[]) => any
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
    if(this._hasChanged()) {
      const exists = this._exists();
      fs.writeJson(this.fileName, this.data);
      exists ? log.info(`Updated ${this.fileName}`) : log.info(`Created ${this.fileName}`);
    }
  }

  public _hasChanged(): boolean {
    const currentNetworkFile = fs.parseJsonIfExists(this.fileName);
    return !isEqual(this.data, currentNetworkFile);
  }

  public _exists(): boolean {
    return !!fs.parseJsonIfExists(this.fileName);
  }
}
