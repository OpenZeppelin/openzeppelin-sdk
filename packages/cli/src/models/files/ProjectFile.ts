import fs from 'fs-extra';
import path from 'path';
import { pickBy, isEqual, isEmpty } from 'lodash';

import { Loggy } from '@openzeppelin/upgrades';
import Dependency from '../dependency/Dependency';
import { MANIFEST_VERSION, checkVersion } from './ManifestVersion';
import { OPEN_ZEPPELIN_FOLDER } from './constants';
import { ProjectCompilerOptions } from '../compiler/ProjectCompilerOptions';

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
  typechain: {
    enabled: boolean;
    outDir?: string;
    target?: string;
  };
}

interface ProjectFileData {
  name: string;
  version: string;
  manifestVersion?: string;
  zosversion?: string;
  dependencies: { [name: string]: string };
  contracts: { [alias: string]: string };
  publish: boolean;
  compiler: Partial<ConfigFileCompilerOptions>;
  telemetryOptIn?: boolean;
}

function getProjectPath(file: string, dir: string): [string, string] {
  if (!dir) dir = file ? getRootFromFilePath(file) : process.cwd();
  if (!file) file = getFileFromRoot(dir);
  return [file, dir];
}

function getRootFromFilePath(file: string): string {
  const dir = path.dirname(file);
  return path.basename(dir) === OPEN_ZEPPELIN_FOLDER ? path.dirname(dir) : dir;
}

function getFileFromRoot(dir: string): string {
  // TODO-v3: remove legacy project file support, preferring the new format over the old one
  return [PROJECT_FILE_PATH, LEGACY_PROJECT_FILE_NAME].map(p => path.join(dir, p)).find(fs.existsSync);
}

export const PROJECT_FILE_NAME = 'project.json';
export const PROJECT_FILE_PATH = path.join(OPEN_ZEPPELIN_FOLDER, PROJECT_FILE_NAME);
export const LEGACY_PROJECT_FILE_NAME = 'zos.json';

export default class ProjectFile {
  public filePath: string;
  public root: string;
  public data: ProjectFileData;

  public static getLinkedDependencies(filePath: string = null): string[] {
    const project = new ProjectFile(filePath);
    if (!project) return [];
    return project.linkedDependencies;
  }

  public static getExistingProject(folder: string): ProjectFile {
    const projectFile = new ProjectFile(null, folder);
    if (!projectFile.exists()) {
      throw new Error(`Could not find an .openzeppelin/project.json or zos.json file in ${folder}`);
    }
    return projectFile;
  }

  public constructor(filePath: string = null, root: string = null) {
    const defaultData = {
      manifestVersion: MANIFEST_VERSION,
    } as any;

    [this.filePath, this.root] = getProjectPath(filePath, root);

    if (this.filePath) {
      try {
        this.data = fs.existsSync(this.filePath) ? fs.readJsonSync(this.filePath) : null;
        // if we failed to read and parse project file
      } catch (e) {
        e.message = `Failed to parse '${path.resolve(this.filePath)}' file. Please make sure that ${
          this.filePath
        } is a valid JSON file. Details: ${e.message}.`;
        throw e;
      }
    }
    this.filePath = this.filePath || PROJECT_FILE_PATH;
    this.data = this.data || defaultData;
    checkVersion(this.data.manifestVersion || this.data.zosversion, this.filePath);
    if (!this.data.contracts) this.data.contracts = {};
    if (!this.data.dependencies) this.data.dependencies = {};
  }

  public exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  public set manifestVersion(version: string) {
    if (this.data.manifestVersion) {
      this.data.manifestVersion = version;
    } else {
      this.data.zosversion = version;
    }
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

  public set telemetryOptIn(optIn: boolean) {
    this.data.telemetryOptIn = optIn;
  }

  public get telemetryOptIn(): boolean | undefined {
    return this.data.telemetryOptIn;
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
    const config: Partial<ConfigFileCompilerOptions> = this.data.compiler;
    const manager = config && config.manager;
    const version = config && config.solcVersion;
    const inputDir = config && config.contractsDir;
    const outputDir = config && config.artifactsDir;
    const compilerSettings = config && config.compilerSettings;
    const typechain = config && config.typechain;
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
      typechain,
    };
  }

  public get linkedDependencies(): string[] {
    const dependencies = this.data.dependencies;
    if (!dependencies) return [];
    return Object.keys(dependencies).map(depName => `${depName}@${dependencies[depName]}`);
  }

  public setCompilerOptions(options: ProjectCompilerOptions): void {
    const { manager, version, outputDir, inputDir, evmVersion, optimizer, typechain } = options;
    const configOptions: ConfigFileCompilerOptions = {
      manager,
      solcVersion: version,
      artifactsDir: outputDir ? path.relative(this.root, outputDir) : undefined,
      contractsDir: inputDir ? path.relative(this.root, inputDir) : undefined,
      compilerSettings: {
        evmVersion,
        optimizer: {
          enabled: optimizer && optimizer.enabled,
          runs: optimizer && optimizer.runs && optimizer.runs.toString(),
        },
      },
      typechain,
    };

    this.data.compiler =
      manager === 'trufle'
        ? { manager: 'truffle' }
        : pickBy({ ...this.data.compiler, ...configOptions } as ConfigFileCompilerOptions);
  }

  // If the argument is an existing contract alias, return its corresponding
  // contract name. Otherwise, assume it's a contract name and return it as is.
  public normalizeContractAlias(nameOrAlias: string): string {
    return this.contracts[nameOrAlias] ?? nameOrAlias;
  }

  public contract(alias: string): string {
    return this.contracts[alias];
  }

  public hasName(name: string): boolean {
    return this.name === name;
  }

  public dependencyMatches(name: string, version: string): boolean {
    return this.hasDependency(name) && Dependency.satisfiesVersion(version, this.getDependencyVersion(name));
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

  public write(): void {
    if (this.hasChanged()) {
      const exists = this.exists();
      fs.writeJsonSync(this.filePath, this.data, { spaces: 2 });
      Loggy.onVerbose(
        __filename,
        'write',
        'write-project-json',
        exists ? `Updated ${this.filePath}` : `Created ${this.filePath}`,
      );
    }
  }

  private hasChanged(): boolean {
    const currentPackgeFile = fs.existsSync(this.filePath) ? fs.readJsonSync(this.filePath) : null;
    return !isEqual(this.data, currentPackgeFile);
  }
}
