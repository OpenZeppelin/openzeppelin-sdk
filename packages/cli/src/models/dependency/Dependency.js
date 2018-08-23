import _ from 'lodash';
import { FileSystem as fs, LibProject, Contracts } from 'zos-lib'
import semver from 'semver';
import npm from 'npm-programmatic'

import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';

export default class Dependency {
  static fromNameWithVersion(nameAndVersion) {
    const [name, version] = nameAndVersion.split('@')
    return new this(name, version)
  }

  static satisfiesVersion(version, requirement) {
    return !requirement || version === requirement || semver.satisfies(version, requirement);
  }  

  constructor(name, version) {
    this.name = name
    this._networkFiles = {}

    const packageVersion = this.getPackageFile().version
    this._validateSatisfiesVersion(packageVersion, version)
    this.version = version || tryWithCaret(packageVersion)    
  }

  async deploy(txParams) {
    const version = semver.coerce(this.version).toString()
    const project = await LibProject.deploy(version, txParams)
    await Promise.all(
      _.map(this.getPackageFile().contracts, (contractName, contractAlias) => {
        const contractClass = Contracts.getFromNodeModules(this.name, contractName)
        return project.setImplementation(contractClass, contractAlias)
      })
    );
    return project
  }

  async install() {
    await npm.install([this.nameAndVersion], { save: true, cwd: process.cwd() })
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
      this._validateSatisfiesVersion(this._networkFiles[network].version, this.version)
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

  _validateSatisfiesVersion(version, requirement) {
    if (!Dependency.satisfiesVersion(version, requirement)) {
      throw Error(`Required dependency version ${requirement} does not match dependency package version ${version}`);
    }
  }
}

function tryWithCaret(version) {
  const cleaned = semver.clean(version);
  return cleaned ? `^${cleaned}` : version;
}
