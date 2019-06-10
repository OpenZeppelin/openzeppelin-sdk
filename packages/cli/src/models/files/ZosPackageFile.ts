import path from 'path';
import pickBy from 'lodash.pickby';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import { Logger, FileSystem as fs } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import { ZOS_VERSION, checkVersion } from './ZosVersion';
import ZosNetworkFile from './ZosNetworkFile';
import { ProjectCompilerOptions } from '../compiler/solidity/SolidityProjectCompiler';

const log = new Logger('ZosPackageFile');

interface ConfigFileCompilerOptions {
  manager: string;
  solcVersion: string;
  contractsDir: string;
  artifactsDir: string;
  compilerSettings: {
    evmVersion: string;
    optimizer: {
      enabled: boolean;
      runs: string;
    };
  };
}

export default class ZosPackageFile {
  public fileName: string;
  public data: {
    name: string;
    version: string;
    zosversion: string;
    dependencies: { [name: string]: string };
    contracts: { [alias: string]: string };
    publish: boolean;
    compiler: ConfigFileCompilerOptions;
  };

  public static getLinkedDependencies(fileName: string = 'zos.json'): string[] {
    const file = fs.parseJsonIfExists(fileName);
    if (file && file.dependencies) {
      return Object.keys(file.dependencies).map(
        depName => `${depName}@${file.dependencies[depName]}`,
      );
    } else return [];
  }

  public constructor(fileName: string = 'zos.json') {
    this.fileName = fileName;
    try {
      this.data = fs.parseJsonIfExists(this.fileName) || {
        zosversion: ZOS_VERSION,
      };
      // if we failed to read and parse zos.json
    } catch (e) {
      e.message = `Failed to parse '${path.resolve(
        fileName,
      )}' file. Please make sure that ${fileName} is a valid JSON file. Details: ${
        e.message
      }.`;
      throw e;
    }
    checkVersion(this.data.zosversion, this.fileName);
  }

  public exists(): boolean {
    return fs.exists(this.fileName);
  }

  public get root(): string {
    return path.dirname(this.fileName);
  }

  public set zosversion(version: string) {
    this.data.zosversion = version;
  }

  public set publish(publish: boolean) {
    this.data.publish = !!publish;
  }

  public set name(name: string) {
    this.data.name = name;
  }

  public get name(): string {
    return this.data.name;
  }

  public set version(version: string) {
    this.data.version = version;
  }

  public get version(): string {
    return this.data.version;
  }

  public set contracts(contracts: { [alias: string]: string }) {
    this.data.contracts = contracts;
  }
  public get contracts(): { [alias: string]: string } {
    return this.data.contracts || {};
  }

  public get dependencies(): { [name: string]: string } {
    return this.data.dependencies || {};
  }

  public get dependenciesNames(): string[] {
    return Object.keys(this.dependencies);
  }

  public getDependencyVersion(name: string): string {
    return this.dependencies[name];
  }

  public hasDependency(name: string): boolean {
    return !!this.dependencies[name];
  }

  public hasDependencies(): boolean {
    return !isEmpty(this.dependencies);
  }

  public get contractAliases(): string[] {
    return Object.keys(this.contracts);
  }

  public get contractNames(): string[] {
    return Object.values(this.contracts);
  }

  public get isPublished(): boolean {
    return !!this.data.publish;
  }

  public get compilerOptions(): ProjectCompilerOptions {
    // Awkward destructuring is due to https://github.com/microsoft/TypeScript/issues/26235
    const config: ConfigFileCompilerOptions = this.data.compiler;
    const manager = config && config.manager;
    const version = config && config.solcVersion;
    const inputDir = config && config.contractsDir;
    const outputDir = config && config.artifactsDir;
    const compilerSettings = config && config.compilerSettings;
    const evmVersion = compilerSettings && compilerSettings.evmVersion;
    const optimizer = compilerSettings && compilerSettings.optimizer;

    return {
      manager,
      inputDir,
      outputDir,
      evmVersion,
      version,
      optimizer,
    };
  }

  public setCompilerOptions(options: ProjectCompilerOptions) {
    const {
      manager,
      version,
      outputDir,
      inputDir,
      evmVersion,
      optimizer,
    } = options;
    const configOptions: ConfigFileCompilerOptions = {
      manager,
      solcVersion: version,
      artifactsDir: outputDir,
      contractsDir: inputDir,
      compilerSettings: {
        evmVersion,
        optimizer,
      },
    };

    this.data.compiler =
      manager === 'trufle'
        ? { manager: 'truffle' }
        : pickBy({ ...this.data.compiler, ...configOptions });
  }

  public contract(alias: string): string {
    return this.contracts[alias];
  }

  public hasName(name: string): boolean {
    return this.name === name;
  }

  public dependencyMatches(name: string, version: string): boolean {
    return (
      this.hasDependency(name) &&
      Dependency.satisfiesVersion(version, this.getDependencyVersion(name))
    );
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
    const networkFileName = this.fileName.replace(
      /\.json\s*$/,
      `.${network}.json`,
    );
    if (networkFileName === this.fileName)
      throw Error(`Cannot create network file name from ${this.fileName}`);
    return new ZosNetworkFile(this, network, networkFileName);
  }

  public write(): void {
    if (this.hasChanged()) {
      const exists = this.exists();
      fs.writeJson(this.fileName, this.data);
      exists
        ? log.info(`Updated ${this.fileName}`)
        : log.info(`Created ${this.fileName}`);
    }
  }

  private hasChanged(): boolean {
    const currentPackgeFile = fs.parseJsonIfExists(this.fileName);
    return !isEqual(this.data, currentPackgeFile);
  }
}
