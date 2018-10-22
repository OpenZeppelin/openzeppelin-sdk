import _ from 'lodash';
import { FileSystem as fs, LibProject, Contracts, getSolidityLibNames, Logger } from 'zos-lib'
import semver from 'semver';
import npm from 'npm-programmatic'

import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

const log = new Logger('Dependency');

export default class Dependency {
  static fromNameWithVersion(nameAndVersion) {
    const [name, version] = nameAndVersion.split('@')
    return new this(name, version)
  }

  static satisfiesVersion(version, requirement) {
    return !requirement 
      || version === requirement 
      || semver.satisfies(version, requirement);
  }

  static async install(nameAndVersion) {
    log.info(`Installing ${nameAndVersion} via npm...`);
    await npm.install([nameAndVersion], { save: true, cwd: process.cwd() });
    return this.fromNameWithVersion(nameAndVersion);
  }

  constructor(name, requirement) {
    this.name = name
    this._networkFiles = {}

    const zosVersion = this.getPackageFile().version
    const npmVersion = this.getNpmFile().version
    this._validateSatisfiesNpmVersion(npmVersion, requirement)
    
    this.version = npmVersion
    this.npmRequirement = requirement || tryWithCaret(npmVersion)
    this.zosRequirement = tryWithCaret(zosVersion)
  }

  get requirement() {
    return this.npmRequirement
  }

  async deploy(txParams) {
    const version = semver.coerce(this.version).toString()
    const project = await LibProject.fetchOrDeploy(version, txParams, {})
    
    // REFACTOR: Logic for filling in solidity libraries is partially duplicated from network base controller,
    // this should all be handled at the Project level. Consider adding a setImplementations (plural) method
    // to Projects, which handle library deployment and linking for a set of contracts altogether.

    const contracts = _.map(this.getPackageFile().contracts, (contractName, contractAlias) => 
      [Contracts.getFromNodeModules(this.name, contractName), contractAlias]
    );
    
    const libraryNames = _(contracts).map(([contractClass]) => (
      getSolidityLibNames(contractClass.bytecode)
    )).flatten().uniq().value();

    const libraries = _.fromPairs(await Promise.all(_.map(libraryNames, async (libraryName) => {
      const implementation = await project.setImplementation(Contracts.getFromNodeModules(this.name, libraryName), libraryName)
      return [libraryName, implementation.address];
    })));

    await Promise.all(_.map(contracts, async ([contractClass, contractAlias]) => {
      contractClass.link(libraries);
      await project.setImplementation(contractClass, contractAlias);
    }));

    return project
  }

  getNpmFile() {
    if (!this._npmFile) {
      const filename = `node_modules/${this.name}/package.json`
      if (!fs.exists(filename)) {
        throw Error(`Could not find a package.json file for '${this.name}'.`)
      }
      this._npmFile = fs.parseJson(filename);
    }
    return this._npmFile
  }

  getPackageFile() {
    if (!this._packageFile) {
      const filename = `node_modules/${this.name}/zos.json`
      if (!fs.exists(filename)) {
        throw Error(`Could not find a zos.json file for '${this.name}'. Make sure it is provided by the npm package.`)
      }
      this._packageFile = new ZosPackageFile(filename)
    }
    return this._packageFile
  }

  getNetworkFile(network) {
    if (!this._networkFiles[network]) {
      const filename = this._getNetworkFilePath(network)
      if (!fs.exists(filename)) {
        throw Error(`Could not find a zos file for network '${network}' for '${this.name}'`)
      }

      this._networkFiles[network] = new ZosNetworkFile(this.getPackageFile(), network, filename)
      this._validateSatisfiesNetworkVersion(this._networkFiles[network].version, this.zosRequirement, network)
    }
    return this._networkFiles[network]
  }

  isDeployedOnNetwork(network) {
    const filename = this._getNetworkFilePath(network)
    if (!fs.exists(filename)) return false
    return !!this.getNetworkFile(network).packageAddress
  }

  _getNetworkFilePath(network) {
    return `node_modules/${this.name}/zos.${network}.json`
  }

  _validateSatisfiesNpmVersion(version, requirement) {
    if (!Dependency.satisfiesVersion(version, requirement)) {
      throw Error(`Dependency ${this.name} requires package version ${requirement}, but ${version} was found. Please update ${this.name} package to the required version.`);
    }
  }

  _validateSatisfiesNetworkVersion(version, requirement, network) {
    if (!Dependency.satisfiesVersion(version, requirement)) {
      throw Error(`Dependency ${this.name} defines version ${semver.coerce(requirement)}, but ${version} was found for network ${network}.`);
    }
  }
}

function tryWithCaret(version) {
  const cleaned = semver.clean(version);
  return cleaned ? `^${cleaned}` : version;
}
