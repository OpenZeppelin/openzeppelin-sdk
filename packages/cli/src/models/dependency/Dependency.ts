import fromPairs from 'lodash.frompairs';
import map from 'lodash.map';
import flatten from 'lodash.flatten';
import uniq from 'lodash.uniq';
import { FileSystem as fs, PackageProject, Contracts, Contract, getSolidityLibNames, Logger } from 'zos-lib';
import semver from 'semver';
import npm from 'npm-programmatic';

import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

const log = new Logger('Dependency');

export default class Dependency {

  public name: string;
  public version: string;
  public nameAndVersion: string;
  public requirement: string | semver.Range;

  private _networkFiles: { [network: string]: ZosNetworkFile };
  private _packageFile: ZosPackageFile;

  public static fromNameWithVersion(nameAndVersion: string): Dependency {
    const [name, version] = nameAndVersion.split('@');
    return new this(name, version);
  }

  public static satisfiesVersion(version: string | semver.SemVer, requirement: string | semver.Range): boolean {
    return !requirement || version === requirement || semver.satisfies(version, requirement);
  }

  public static async install(nameAndVersion: string): Promise<Dependency> {
    log.info(`Installing ${nameAndVersion} via npm...`);
    await npm.install([nameAndVersion], { save: true, cwd: process.cwd() });
    return this.fromNameWithVersion(nameAndVersion);
  }

  constructor(name: string, requirement?: string | semver.Range) {
    this.name = name;
    this._networkFiles = {};

    const packageVersion = this.getPackageFile().version;
    this._validateSatisfiesVersion(packageVersion, requirement);
    this.version = packageVersion;
    this.nameAndVersion = `${name}@${packageVersion}`;
    this.requirement = requirement || tryWithCaret(packageVersion);
  }

  public async deploy(txParams: any): Promise<PackageProject> {
    const version = semver.coerce(this.version).toString();
    const project = await PackageProject.fetchOrDeploy(version, txParams, {});

    // REFACTOR: Logic for filling in solidity libraries is partially duplicated from network base controller,
    // this should all be handled at the Project level. Consider adding a setImplementations (plural) method
    // to Projects, which handle library deployment and linking for a set of contracts altogether.

    const contracts = <Array<[Contract, string]>>map(this.getPackageFile().contracts, (contractName, contractAlias) =>
      [Contracts.getFromNodeModules(this.name, contractName), contractAlias]
    );

    const pipeline = [
      (someContracts) => map(someContracts, ([contract]) => getSolidityLibNames(contract.schema.bytecode)),
      (someContracts) => flatten(someContracts),
      (someContracts) => uniq(someContracts),
    ];

    const libraryNames = pipeline.reduce((xs, f) => f(xs), contracts);

    const libraries = fromPairs(await Promise.all(map(libraryNames, async (libraryName) => {
      const implementation = await project.setImplementation(Contracts.getFromNodeModules(this.name, libraryName), libraryName);
      return [libraryName, implementation.address];
    })));

    await Promise.all(map(contracts, async ([contract, contractAlias]) => {
      contract.link(libraries);
      await project.setImplementation(contract, contractAlias);
    }));

    return project;
  }

  public getPackageFile(): ZosPackageFile | never {
    if (!this._packageFile) {
      const filename = `node_modules/${this.name}/zos.json`;
      if (!fs.exists(filename)) {
        throw Error(`Could not find a zos.json file for '${this.name}'. Make sure it is provided by the npm package.`);
      }
      this._packageFile = new ZosPackageFile(filename);
    }
    return this._packageFile;
  }

  public getNetworkFile(network: string): ZosNetworkFile | never {
    if (!this._networkFiles[network]) {
      const filename = this._getNetworkFilePath(network);
      if (!fs.exists(filename)) {
        throw Error(`Could not find a zos file for network '${network}' for '${this.name}'`);
      }

      this._networkFiles[network] = new ZosNetworkFile(this.getPackageFile(), network, filename);
      this._validateSatisfiesVersion(this._networkFiles[network].version, this.requirement);
    }
    return this._networkFiles[network];
  }

  public isDeployedOnNetwork(network: string): boolean {
    const filename = this._getNetworkFilePath(network);
    if (!fs.exists(filename)) return false;
    return !!this.getNetworkFile(network).packageAddress;
  }

  private _getNetworkFilePath(network: string): string {
    return `node_modules/${this.name}/zos.${network}.json`;
  }

  private _validateSatisfiesVersion(version: string, requirement: string | semver.Range): void | never {
    if (!Dependency.satisfiesVersion(version, requirement)) {
      throw Error(`Required dependency version ${requirement} does not match version ${version}`);
    }
  }
}

function tryWithCaret(version: string): string {
  const cleaned = semver.clean(version);
  return cleaned ? `^${cleaned}` : version;
}
