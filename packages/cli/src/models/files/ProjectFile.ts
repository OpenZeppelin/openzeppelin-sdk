import path from 'path';
import pickBy from 'lodash.pickby';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';

import { Loggy, FileSystem as fs } from 'zos-lib';
import Dependency from '../dependency/Dependency';
import { MANIFEST_VERSION, checkVersion } from './ManifestVersion';
import { OPEN_ZEPPELIN_FOLDER } from './constants';
import NetworkFile from './NetworkFile';
import { ProjectCompilerOptions } from '../compiler/solidity/SolidityProjectCompiler';

interface ConfigFileCompilerOptions {
  manager: string;
  solcVersion: string;
  contractsDir: string;
  artifactsDir: string;
  compilerSettings: {
    evmVersion: string;
    optimizer: {
      enabled: boolean;
      runs?: string;
    };
  };
}

interface ProjectFileData {
  name: string;
  version: string;
  manifestVersion: string;
  dependencies: { [name: string]: string };
  contracts: { [alias: string]: string };
  publish: boolean;
  compiler: ConfigFileCompilerOptions;
}

export const PROJECT_FILE_NAME = 'project.json';
export const PROJECT_FILE_PATH = path.join(
  OPEN_ZEPPELIN_FOLDER,
  PROJECT_FILE_NAME,
);
export const LEGACY_PROJECT_FILE_NAME = 'zos.json';

export default class ProjectFile {
  public filePath: string;
  public data: ProjectFileData;

  public static getLinkedDependencies(
    fileName: string = PROJECT_FILE_NAME,
  ): string[] {
    const file = fs.parseJsonIfExists(fileName);
    if (file && file.dependencies) {
      return Object.keys(file.dependencies).map(
        depName => `${depName}@${file.dependencies[depName]}`,
      );
    } else return [];
  }

  public constructor(filePath: string = null) {
    const defaultData = {
      manifestVersion: MANIFEST_VERSION,
    } as any;
    // if project file path is provided use only it
    if (filePath) {
      this.filePath = filePath;
      this.data = this.tryToLoadProject(filePath);
    } else {
      // try to load legacy file first
      // TODO: remove legacy project file support as a breaking change at 3.0
      let data = this.tryToLoadProject(LEGACY_PROJECT_FILE_NAME);
      if (data) {
        this.data = data;
        this.filePath = LEGACY_PROJECT_FILE_NAME;
      } else {
        // if there is no legacy project file try to load a normal project file
        data = this.tryToLoadProject(PROJECT_FILE_PATH);
        // if no project file available start a new one
        this.data = data;
        this.filePath = PROJECT_FILE_PATH;
      }
    }
    this.data = this.data || defaultData;
    checkVersion(this.data.manifestVersion, this.filePath);
    if (!this.data.contracts) this.data.contracts = {};
    if (!this.data.dependencies) this.data.dependencies = {};
  }

  public exists(): boolean {
    return fs.exists(this.filePath);
  }

  public get root(): string {
    return path.dirname(this.filePath);
  }

  public set manifestVersion(version: string) {
    this.data.manifestVersion = version;
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
      optimizer: {
        enabled: optimizer && optimizer.enabled,
        runs: optimizer && optimizer.runs && parseInt(optimizer.runs),
      },
    };
  }

  public setCompilerOptions(options: ProjectCompilerOptions): void {
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
        optimizer: {
          enabled: optimizer && optimizer.enabled,
          runs: optimizer && optimizer.runs && optimizer.runs.toString(),
        },
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

  public networkFile(network): NetworkFile | never {
    return new NetworkFile(
      this,
      network,
      path.join(OPEN_ZEPPELIN_FOLDER, `${network}.json`),
    );
  }

  public write(): void {
    if (this.hasChanged()) {
      const exists = this.exists();
      fs.writeJson(this.filePath, this.data);
      Loggy.onVerbose(
        __filename,
        'write',
        'write-zos-json',
        exists ? `Updated ${this.filePath}` : `Created ${this.filePath}`,
      );
    }
  }

  private hasChanged(): boolean {
    const currentPackgeFile = fs.parseJsonIfExists(this.filePath);
    return !isEqual(this.data, currentPackgeFile);
  }

  private tryToLoadProject(filePath: string): ProjectFileData {
    try {
      return fs.parseJsonIfExists(filePath);
      // if we failed to read and parse project file
    } catch (e) {
      e.message = `Failed to parse '${path.resolve(
        filePath,
      )}' file. Please make sure that ${filePath} is a valid JSON file. Details: ${
        e.message
      }.`;
      throw e;
    }
  }
}
