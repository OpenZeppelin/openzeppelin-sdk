import BasePackageProject from './BasePackageProject';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { DeployError } from '../utils/errors/DeployError';
import { semanticVersionToString } from '../utils/Semver';
import { TxParams } from '../artifacts/ZWeb3';

export default class PackageProject extends BasePackageProject {
  public static async fetch(
    packageAddress: string,
    version: string = '0.1.0',
    txParams: TxParams,
  ): Promise<PackageProject> {
    const thepackage: Package = Package.fetch(packageAddress, txParams);
    return new this(thepackage, version, txParams);
  }

  // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
  public static async fetchOrDeploy(
    version: string = '0.1.0',
    txParams: TxParams = {},
    { packageAddress }: { packageAddress?: string } = {},
  ): Promise<PackageProject | never> {
    let thepackage: Package;
    let directory: ImplementationDirectory;
    version = semanticVersionToString(version);

    try {
      thepackage = packageAddress ? Package.fetch(packageAddress, txParams) : await Package.deploy(txParams);
      directory = (await thepackage.hasVersion(version))
        ? await thepackage.getDirectory(version)
        : await thepackage.newVersion(version);

      const project: PackageProject = new this(thepackage, version, txParams);
      project.directory = directory;

      return project;
    } catch (error) {
      throw new DeployError(error, { thepackage, directory });
    }
  }

  public constructor(thepackage: Package, version: string = '0.1.0', txParams: TxParams = {}) {
    super(txParams);
    this.package = thepackage;
    this.version = semanticVersionToString(version);
  }

  public async getImplementation({ contractName }: { contractName: string }): Promise<string> {
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    return directory.getImplementation(contractName);
  }

  public async getProjectPackage(): Promise<Package> {
    return this.package;
  }

  public async getCurrentDirectory(): Promise<ImplementationDirectory> {
    if (!this.directory) {
      const thepackage: Package = await this.getProjectPackage();
      this.directory = await thepackage.getDirectory(this.version);
    }
    return this.directory;
  }

  public async getCurrentVersion(): Promise<string> {
    return this.version;
  }
}
