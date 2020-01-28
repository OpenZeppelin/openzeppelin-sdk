import fs from 'fs';
import map from 'lodash.map';
import uniq from 'lodash.uniq';
import flatten from 'lodash.flatten';
import fromPairs from 'lodash.frompairs';
import toPairs from 'lodash.topairs';
import semver from 'semver';
import npm from 'npm-programmatic';
import { exec } from 'child_process';
import { promisify } from 'util';

import { TxParams, PackageProject, Contracts, Contract, getSolidityLibNames, Loggy } from '@openzeppelin/upgrades';
import ProjectFile, { LEGACY_PROJECT_FILE_NAME, PROJECT_FILE_PATH } from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
import { OPEN_ZEPPELIN_FOLDER } from '../files/constants';
import { dirname } from 'path';

export default class Dependency {
  public name: string;
  public version: string;
  public nameAndVersion: string;
  public requirement: string | semver.Range;

  private _networkFiles: { [network: string]: NetworkFile };
  private _projectFile: ProjectFile;

  public static fromNameWithVersion(nameAndVersion: string): Dependency {
    const [name, version] = this.splitNameAndVersion(nameAndVersion);
    return new this(name, version);
  }

  public static satisfiesVersion(version: string | semver.SemVer, requirement: string | semver.Range): boolean {
    return !requirement || version === requirement || semver.satisfies(semver.coerce(version), requirement);
  }

  public static async fetchVersionFromNpm(name: string): Promise<string> {
    const execAsync = promisify(exec);
    try {
      const { stdout } = await execAsync(`npm view ${name}@latest version`);
      const version = new semver.SemVer(stdout.trim());
      return `${name}@^${version.major}.${version.minor}.0`;
    } catch (error) {
      return name;
    }
  }

  public static hasDependenciesForDeploy(network: string, packageFileName?: string, networkFileName?: string): boolean {
    const project = new ProjectFile(packageFileName);
    const dependencies = project.linkedDependencies;
    const networkFile = new NetworkFile(project, network, networkFileName);
    const hasDependenciesForDeploy = dependencies.find((depNameAndVersion): any => {
      const dependency = Dependency.fromNameWithVersion(depNameAndVersion);
      return !(
        dependency.isDeployedOnNetwork(network) || networkFile.dependencyHasMatchingCustomDeploy(dependency.name)
      );
    });

    return !!hasDependenciesForDeploy;
  }

  public static async install(nameAndVersion: string): Promise<Dependency> {
    Loggy.spin(__filename, 'install', `install-dependency-${nameAndVersion}`, `Installing ${nameAndVersion} via npm`);
    await npm.install([nameAndVersion], { save: true, cwd: process.cwd() });
    Loggy.succeed(`install-dependency-${nameAndVersion}`, `Dependency ${nameAndVersion} installed`);
    return this.fromNameWithVersion(nameAndVersion);
  }

  public static splitNameAndVersion(nameAndVersion: string): [string, string] {
    const parts = nameAndVersion.split('@');
    if (parts[0].length === 0) {
      parts.shift();
      parts[0] = `@${parts[0]}`;
    }
    return [parts[0], parts[1]];
  }

  public constructor(name: string, requirement?: string | semver.Range) {
    this.name = name;
    this._networkFiles = {};

    const projectVersion = this.projectFile.version;
    this.validateSatisfiesVersion(projectVersion, requirement);
    this.version = projectVersion;
    this.nameAndVersion = `${name}@${projectVersion}`;
    this.requirement = requirement || tryWithCaret(projectVersion);
  }

  public async deploy(txParams: TxParams): Promise<PackageProject> {
    const version = semver.coerce(this.version).toString();
    const project = await PackageProject.fetchOrDeploy(version, txParams, {});

    // REFACTOR: Logic for filling in solidity libraries is partially duplicated from network base controller,
    // this should all be handled at the Project level. Consider adding a setImplementations (plural) method
    // to Projects, which handle library deployment and linking for a set of contracts altogether.

    const contracts = toPairs(this.projectFile.contracts).map(([contractAlias, contractName]): [Contract, string] => [
      Contracts.getFromNodeModules(this.name, contractName),
      contractAlias,
    ]);

    const libraryNames = uniq(flatten(contracts.map(([contract]) => getSolidityLibNames(contract.schema.bytecode))));

    const libraries = fromPairs(
      await Promise.all(
        map(libraryNames, async libraryName => {
          const implementation = await project.setImplementation(
            Contracts.getFromNodeModules(this.name, libraryName),
            libraryName,
          );
          return [libraryName, implementation.address];
        }),
      ),
    );

    await Promise.all(
      map(contracts, async ([contract, contractAlias]) => {
        contract.link(libraries);
        await project.setImplementation(contract, contractAlias);
      }),
    );

    return project;
  }

  public get projectFile(): ProjectFile | never {
    if (!this._projectFile) {
      this._projectFile = ProjectFile.getExistingProject(this.getDependencyFolder());
    }
    return this._projectFile;
  }

  public getNetworkFile(network: string): NetworkFile | never {
    if (!this._networkFiles[network]) {
      const filePath = this.getExistingNetworkFilePath(network);

      if (!fs.existsSync(filePath)) {
        throw Error(`Could not find a project file for network '${network}' for '${this.name}'`);
      }

      this._networkFiles[network] = new NetworkFile(this.projectFile, network, filePath);
      this.validateSatisfiesVersion(this._networkFiles[network].version, this.requirement);
    }
    return this._networkFiles[network];
  }

  public isDeployedOnNetwork(network: string): boolean {
    const filePath = this.getExistingNetworkFilePath(network);
    if (!fs.existsSync(filePath)) return false;
    return !!this.getNetworkFile(network).packageAddress;
  }

  private getDependencyFolder(): string {
    try {
      return dirname(require.resolve(`${this.name}/package.json`, { paths: [process.cwd()] }));
    } catch (err) {
      throw new Error(`Could not find dependency ${this.name}.`);
    }
  }

  private getExistingNetworkFilePath(network: string): string {
    return NetworkFile.getExistingFilePath(network, this.getDependencyFolder());
  }

  private validateSatisfiesVersion(version: string, requirement: string | semver.Range): void | never {
    if (!Dependency.satisfiesVersion(version, requirement)) {
      throw Error(`Required dependency version ${requirement} does not match version ${version}`);
    }
  }
}

function tryWithCaret(version: string): string {
  const cleaned = semver.clean(version);
  return cleaned ? `^${cleaned}` : version;
}
