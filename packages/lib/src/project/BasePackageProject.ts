import { deploy } from '../utils/Transactions';
import Logger from '../utils/Logger';
import { semanticVersionToString } from '../utils/Semver';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';
import ImplementationDirectory from '../application/ImplementationDirectory';
import Package from '../application/Package';

const log: any = new Logger('PackageProject');

export default class BasePackageProject {
  protected txParams: any;
  protected version: string;
  protected package: Package;
  protected directory: ImplementationDirectory;

  constructor(txParams) {
    this.txParams = txParams;
  }

  public async newVersion(version: string): Promise<ImplementationDirectory> {
    const thepackage: Package = await this.getProjectPackage();
    const directory: ImplementationDirectory = await thepackage.newVersion(version);
    this.directory = directory;
    this.version = semanticVersionToString(version);
    return directory;
  }

  // TODO: Testme
  public async freeze(): Promise<void> {
    const version: string = await this.getCurrentVersion();
    log.info(`Freezing version ${version}...`);
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.freeze();
    log.info(`Version ${version} has been frozen`);
  }

  public async setImplementation(contractClass: ContractFactory, contractName: string): Promise<any> {
    if (!contractName) contractName = contractClass.contractName;
    log.info(`Setting implementation of ${contractName} in directory...`);
    const implementation: any = await deploy(contractClass, [], this.txParams);
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, implementation.address);
    log.info(`Implementation set: ${implementation.address}`);
    return implementation;
  }

  public async unsetImplementation(contractName: string): Promise<void> {
    log.info(`Unsetting implementation of ${contractName}...`);
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.unsetImplementation(contractName);
  }

  public async registerImplementation(contractName: string, { address }: { address: string }): Promise<void> {
    log.info(`Registering implementation of ${contractName} at ${address} in directory...`);
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, address);
  }

  public async getCurrentDirectory(): Promise<any> {
    throw Error('Unimplemented');
  }

  public async getProjectPackage(): Promise<any> {
    throw Error('Unimplemented');
  }

  public async getCurrentVersion(): Promise<any> {
    throw Error('Unimplemented');
  }
}
