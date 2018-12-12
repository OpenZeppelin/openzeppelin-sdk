import BasePackageProject from "./BasePackageProject";
import Package from "../application/Package";
import { DeployError } from '../utils/errors/DeployError';
import { semanticVersionToString } from "../utils/Semver";

export default class PackageProject extends BasePackageProject {
  static async fetch(packageAddress, version = '0.1.0', txParams) {
    const thepackage = await Package.fetch(packageAddress, txParams)
    return new this(thepackage, version, txParams)
  }

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  static async fetchOrDeploy(version = '0.1.0', txParams = {}, { packageAddress = undefined } = {}) {
    let thepackage, directory
    version = semanticVersionToString(version)

    try {
      thepackage = packageAddress
        ? await Package.fetch(packageAddress, txParams)
        : await Package.deploy(txParams)
      directory = await thepackage.hasVersion(version)
        ? await thepackage.getDirectory(version)
        : await thepackage.newVersion(version)

      const project = new this(thepackage, version, txParams)
      project.directory = directory

      return project
    } catch(error) {
      throw new DeployError(error, { thepackage, directory })
    }
  }

  constructor(thepackage, version = '0.1.0', txParams = {}) {
    super(txParams)
    this.package = thepackage
    this.version = semanticVersionToString(version)
  }

  async getImplementation({ contractName }) {
    const directory = await this.getCurrentDirectory()
    return directory.getImplementation(contractName)
  }

  async getProjectPackage() {
    return this.package
  }

  async getCurrentDirectory() {
    if (!this.directory) {
      const thepackage = await this.getProjectPackage()
      this.directory = await thepackage.getDirectory(this.version)
    }
    return this.directory
  }

  async getCurrentVersion() {
    return this.version
  }
}
