import Project from "./Project";
import Package from "../package/Package";

export default class LibProject extends Project {
  static async fetch(packageAddress, version = '0.1.0', txParams) {
    const thepackage = await Package.fetch(packageAddress, txParams)
    return new this(thepackage, version, txParams)
  }

  static async deploy(version = '0.1.0', txParams = {}) {
    const thepackage = await Package.deploy(txParams)
    const directory = await thepackage.newVersion(version)
    const project = new this(thepackage, version, txParams)
    project.directory = directory
    return project
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
