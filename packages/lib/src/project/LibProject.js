import BasePackageProject from "./BasePackageProject";
import Package from "../package/Package";
import { DeployError } from '../utils/errors/DeployError';

export default class LibProject extends BasePackageProject {
  static async fetch(packageAddress, version = '0.1.0', txParams) {
    const thepackage = await Package.fetch(packageAddress, txParams)
    return new this(thepackage, version, txParams)
  }

  static async fetchOrDeploy(version = '0.1.0', txParams = {}, { packageAddress = undefined }) {
    let thepackage, directory
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
    } catch(deployError) {
      throw new DeployError(deployError.message, { thepackage, directory })
    }
  }

  constructor(thepackage, version = '0.1.0', txParams = {}) {
    super(txParams)
    this.package = thepackage
    this.version = version
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
