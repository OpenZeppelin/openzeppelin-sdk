import Transactions from '../utils/Transactions';
import Logger from '../utils/Logger';
import { semanticVersionToString } from '../utils/Semver';
import Contract from '../artifacts/Contract';
import ImplementationDirectory from '../application/ImplementationDirectory';
import Package from '../application/Package';

const log: Logger = new Logger('PackageProject');

export default abstract class BasePackageProject {

  protected txParams: any;
  public version: string;
  public package: Package;
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

  public async setImplementation(contract: Contract, contractName: string): Promise<Contract> {
    if (!contractName) contractName = contract.schema.contractName;
    log.info(`Setting implementation of ${contractName} in directory...`);
    const implementation: any = await Transactions.deployContract(contract, [], this.txParams);
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

  public abstract async getCurrentDirectory(): Promise<any>;

  public abstract async getProjectPackage(): Promise<any>;

  public abstract async getCurrentVersion(): Promise<any>;
}
