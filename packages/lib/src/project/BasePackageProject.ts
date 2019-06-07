import path from 'path';

import Transactions from '../utils/Transactions';
import Logger, { Loggy, LogLevel } from '../utils/Logger';
import { semanticVersionToString } from '../utils/Semver';
import Contract from '../artifacts/Contract';
import ImplementationDirectory from '../application/ImplementationDirectory';
import Package from '../application/Package';
import { TxParams } from '../artifacts/ZWeb3';

const fileName = path.basename(__filename);
const log: Logger = new Logger('PackageProject');

export default abstract class BasePackageProject {
  protected txParams: TxParams;
  public version: string;
  public package: Package;
  protected directory: ImplementationDirectory;

  public constructor(txParams) {
    this.txParams = txParams;
  }

  public async newVersion(version: string): Promise<ImplementationDirectory> {
    const thepackage: Package = await this.getProjectPackage();
    const directory: ImplementationDirectory = await thepackage.newVersion(
      version,
    );
    this.directory = directory;
    this.version = semanticVersionToString(version);
    return directory;
  }

  // TODO: Testme
  public async freeze(): Promise<void> {
    const version: string = await this.getCurrentVersion();
    Loggy.add(
      `${fileName}#freeze`,
      `freezing-${version}`,
      `Freezing version ${version}`,
    );
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.freeze();
    Loggy.succeed(`freezing-${version}`, `Version ${version} has been frozen`);
  }

  public async setImplementation(
    contract: Contract,
    contractName: string,
  ): Promise<Contract> {
    if (!contractName) contractName = contract.schema.contractName;
    Loggy.add(
      `${fileName}#setImplementation`,
      `set-implementation-${contractName}`,
      `Setting implementation of ${contractName} in directory`,
      { logLevel: LogLevel.Verbose },
    );
    const implementation: any = await Transactions.deployContract(
      contract,
      [],
      this.txParams,
    );
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, implementation.address);
    Loggy.succeed(
      `set-implementation-${contractName}`,
      `Implementation set: ${implementation.address}`,
    );
    return implementation;
  }

  public async unsetImplementation(contractName: string): Promise<void> {
    Loggy.add(
      `${fileName}#unsetImplementation`,
      `unset-implementation-${contractName}`,
      `Unsetting implementation of ${contractName}`,
      { logLevel: LogLevel.Verbose },
    );
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.unsetImplementation(contractName);
    Loggy.succeed(`unset-implementation-${contractName}`);
  }

  public async registerImplementation(
    contractName: string,
    { address }: { address: string },
  ): Promise<void> {
    Loggy.add(
      `${fileName}#registerImplementation`,
      `register-implementation-${contractName}`,
      `Registering ${contractName} at ${address} in directory`,
    );
    const directory: ImplementationDirectory = await this.getCurrentDirectory();
    await directory.setImplementation(contractName, address);
    Loggy.succeed(`register-implementation-${contractName}`);
  }

  public abstract async getCurrentDirectory(): Promise<any>;

  public abstract async getProjectPackage(): Promise<any>;

  public abstract async getCurrentVersion(): Promise<any>;
}
