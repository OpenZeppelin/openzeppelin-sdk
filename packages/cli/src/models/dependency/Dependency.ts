import map from 'lodash.map';
import uniq from 'lodash.uniq';
import flatten from 'lodash.flatten';
import fromPairs from 'lodash.frompairs';
import semver from 'semver';
import npm from 'npm-programmatic';
import { exec } from 'child_process';
import { promisify } from 'util';

import { TxParams, FileSystem as fs, PackageProject, Contracts, Contract, getSolidityLibNames, Loggy } from '@openzeppelin/upgrades';
import ProjectFile, { LEGACY_PROJECT_FILE_NAME, PROJECT_FILE_PATH } from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
import { OPEN_ZEPPELIN_FOLDER } from '../files/constants';

export default class Dependency {
  public name: string;
  public version: string;
  public nameAndVersion: string;
  public requirement: string | semver.Range;

  private _networkFiles: { [network: string]: NetworkFile };
  private _projectFile: ProjectFile;

  public static fromNameWithVersion(nameAndVersion: string): Dependency {
    const [name, version] = nameAndVersion.split('@');
    return new this(name, version);
  }

  public static satisfiesVersion(version: string | semver.SemVer, requirement: string | semver.Range): boolean {
    return !requirement || version === requirement || semver.satisfies(semver.coerce(version), requirement);
  }

  public static async fetchVersionFromNpm(name: string): Promise<string> {
    const execAsync = promisify(exec);
    try {
      const { stdout } = await execAsync(`npm view ${name} | grep latest`);
      const versionMatch = stdout.match(/([0-9]+\.){2}[0-9]+/);
      return Array.isArray(versionMatch) && versionMatch.length > 0 ? `${name}@${versionMatch[0]}` : name;
    } catch (error) {
      return name;
    }
  }

  public static hasDependenciesForDeploy(network: string): boolean {
    const dependencies = ProjectFile.getLinkedDependencies() || [];
    const networkDependencies = new NetworkFile(null, network).dependencies;
    const hasDependenciesForDeploy = dependencies.find(
      (depNameAndVersion): any => {
        const [name, version] = depNameAndVersion.split('@');
        const networkFilePath = Dependency.getExistingNetworkFilePath(name, network);
        const projectDependency = networkDependencies[name];
        const satisfiesVersion = projectDependency && this.satisfiesVersion(projectDependency.version, version);
        return !fs.exists(networkFilePath) && !satisfiesVersion;
      },
    );

    return !!hasDependenciesForDeploy;
  }

  public static async install(nameAndVersion: string): Promise<Dependency> {
    Loggy.spin(__filename, 'install', `install-dependency-${nameAndVersion}`, `Installing ${nameAndVersion} via npm`);
    await npm.install([nameAndVersion], { save: true, cwd: process.cwd() });
    Loggy.succeed(`install-dependency-${nameAndVersion}`, `Dependency ${nameAndVersion} installed`);
    return this.fromNameWithVersion(nameAndVersion);
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

    const contracts = map(this.projectFile.contracts, (contractName, contractAlias) => [
      Contracts.getFromNodeModules(this.name, contractName),
      contractAlias,
    ]) as [Contract, string][];

    const pipeline = [
      someContracts => map(someContracts, ([contract]) => getSolidityLibNames(contract.schema.bytecode)),
      someContracts => flatten(someContracts),
      someContracts => uniq(someContracts),
    ];

    const libraryNames = pipeline.reduce((xs, f) => f(xs), contracts);

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
      const filePath = ProjectFile.getExistingFilePath(`node_modules/${this.name}`);
      if (!filePath) {
        throw new Error(
          `Could not find a project.json file for '${this.name}'. Make sure it is provided by the npm package.`,
        );
      }
      this._projectFile = new ProjectFile(filePath);
    }
    return this._projectFile;
  }

  public getNetworkFile(network: string): NetworkFile | never {
    if (!this._networkFiles[network]) {
      const filePath = Dependency.getExistingNetworkFilePath(this.name, network);

      if (!fs.exists(filePath)) {
        throw Error(`Could not find a project file for network '${network}' for '${this.name}'`);
      }

      this._networkFiles[network] = new NetworkFile(this.projectFile, network, filePath);
      this.validateSatisfiesVersion(this._networkFiles[network].version, this.requirement);
    }
    return this._networkFiles[network];
  }

  public isDeployedOnNetwork(network: string): boolean {
    const filePath = Dependency.getExistingNetworkFilePath(this.name, network);
    if (!fs.exists(filePath)) return false;
    return !!this.getNetworkFile(network).packageAddress;
  }

  private static getExistingNetworkFilePath(name: string, network: string): string {
    // TODO-v3: Remove legacy project file support
    let legacyFilePath = `node_modules/${name}/zos.${network}.json`;
    legacyFilePath = fs.exists(legacyFilePath) ? legacyFilePath : null;
    let filePath = `node_modules/${this.name}/${OPEN_ZEPPELIN_FOLDER}/${network}.json`;
    filePath = fs.exists(filePath) ? filePath : null;
    return filePath || legacyFilePath;
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
