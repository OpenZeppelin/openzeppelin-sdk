import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import { Logger, FileSystem as fs } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import { ZOS_VERSION, checkVersion } from './ZosVersion';
import ZosNetworkFile from './ZosNetworkFile';
const log = new Logger('ZosPackageFile');

export default class ZosPackageFile {

  public fileName: string;
  public data: {
    name: string;
    version: string;
    zosversion: string;
    dependencies: { [name: string]: string };
    contracts: { [alias: string]: string };
    publish: boolean;
  };

  constructor(fileName: string = 'zos.json') {
    this.fileName = fileName;
    this.data = fs.parseJsonIfExists(this.fileName) || { zosversion: ZOS_VERSION };
    checkVersion(this.data.zosversion, this.fileName);
  }

  public exists(): boolean {
    return fs.exists(this.fileName);
  }

  get name(): string {
    return this.data.name;
  }

  get version(): string {
    return this.data.version;
  }

  get dependencies(): { [name: string]: string } {
    return this.data.dependencies || {};
  }

  get dependenciesNames(): string[] {
    return Object.keys(this.dependencies);
  }

  public getDependencyVersion(name: string): string {
    return this.dependencies[name];
  }

  public hasDependency(name: string): boolean {
    return !!(this.dependencies[name]);
  }

  public hasDependencies(): boolean {
    return !isEmpty(this.dependencies);
  }

  get contracts(): { [alias: string]: string } {
    return this.data.contracts || {};
  }

  get contractAliases(): string[] {
    return Object.keys(this.contracts);
  }

  get contractNames(): string[] {
    return Object.values(this.contracts);
  }

  get isPublished(): boolean {
    return !!this.data.publish;
  }

  public contract(alias: string): string {
    return this.contracts[alias];
  }

  public hasName(name: string): boolean {
    return this.name === name;
  }

  public dependencyMatches(name: string, version: string): boolean {
    return this.hasDependency(name) &&
      Dependency.satisfiesVersion(version, this.getDependencyVersion(name));
  }

  public isCurrentVersion(version: string): boolean {
    return this.version === version;
  }

  public hasContract(alias: string): boolean {
    return !!this.contract(alias);
  }

  public hasContracts(): boolean {
    return !isEmpty(this.contracts);
  }

  set zosversion(version: string) {
    this.data.zosversion = version;
  }

  set publish(publish: boolean) {
    this.data.publish = !!publish;
  }

  set name(name: string) {
   this.data.name = name;
  }

  set version(version: string) {
    this.data.version = version;
  }

  set contracts(contracts: { [alias: string]: string }) {
    this.data.contracts = contracts;
  }

  public setDependency(name: string, version: string): void {
    if (!this.data.dependencies) this.data.dependencies = {};
    this.data.dependencies[name] = version;
  }

  public unsetDependency(name: string): void {
    if (!this.data.dependencies) return;
    delete this.data.dependencies[name];
  }

  public addContract(alias: string, name: string | undefined): void {
    this.data.contracts[alias] = name || alias;
  }

  public unsetContract(alias: string): void {
    delete this.data.contracts[alias];
  }

  public networkFile(network): ZosNetworkFile | never {
    const networkFileName = this.fileName.replace(/\.json\s*$/, `.${network}.json`);
    if(networkFileName === this.fileName) throw Error(`Cannot create network file name from ${this.fileName}`);
    return new ZosNetworkFile(this, network, networkFileName);
  }

  public write(): void {
    if(this.hasChanged()) {
      const exists = this.exists();
      fs.writeJson(this.fileName, this.data);
      exists ? log.info(`Updated ${this.fileName}`) : log.info(`Created ${this.fileName}`);
    }
  }

  private hasChanged(): boolean {
    const currentPackgeFile = fs.parseJsonIfExists(this.fileName);
    return !isEqual(this.data, currentPackgeFile);
  }
}
