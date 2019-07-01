import { Loggy } from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { toSemanticVersion, SemanticVersion } from '../utils/Semver';
import { isZeroAddress } from '../utils/Addresses';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
import Transactions from '../utils/Transactions';

export default class Package {
  private packageContract: Contract;
  private txParams: TxParams;

  public static fetch(address: string, txParams: TxParams = {}): Package | null {
    if (isZeroAddress(address)) return null;
    const PackageContact = Contracts.getFromLib('Package');
    const packageContract = PackageContact.at(address);
    return new this(packageContract, txParams);
  }

  public static async deploy(txParams: TxParams = {}): Promise<Package> {
    const PackageContract: Contract = Contracts.getFromLib('Package');
    const packageContract = await Transactions.deployContract(PackageContract, [], txParams);
    Loggy.onVerbose(
      __filename,
      'deploy',
      `deployed-package-${packageContract.address}`,
      `Deployed Package ${packageContract.address}`,
    );
    return new this(packageContract, txParams);
  }

  public constructor(packageContract: Contract, txParams: TxParams = {}) {
    this.packageContract = packageContract;
    this.txParams = txParams;
  }

  public get contract(): Contract {
    return this.packageContract;
  }

  public get address(): string {
    return this.packageContract.address;
  }

  public async hasVersion(version: string): Promise<boolean> {
    return this.packageContract.methods.hasVersion(toSemanticVersion(version)).call();
  }

  public async isFrozen(version: string): Promise<boolean | never> {
    const directory = await this.getDirectory(version);
    return directory.isFrozen();
  }

  public async freeze(version: string): Promise<any | never> {
    const directory = await this.getDirectory(version);
    if (!directory.freeze) throw Error('Implementation directory does not support freezing');
    return directory.freeze();
  }

  public async getImplementation(version: string, contractName: string): Promise<string | never> {
    const directory = await this.getDirectory(version);
    return directory.getImplementation(contractName);
  }

  public async newVersion(version: string, content: string = ''): Promise<ImplementationDirectory> {
    const semver: SemanticVersion = toSemanticVersion(version);
    const directory: ImplementationDirectory = await ImplementationDirectory.deploy({ ...this.txParams });
    await Transactions.sendTransaction(
      this.packageContract.methods.addVersion,
      [semver, directory.address, Buffer.from(content)],
      { ...this.txParams },
    );
    return directory;
  }

  public async getDirectory(version: string): Promise<ImplementationDirectory | never> {
    if (!version) throw Error('Cannot get a directory from a package without specifying a version');
    const directoryAddress = await this.packageContract.methods.getContract(toSemanticVersion(version)).call();
    return ImplementationDirectory.fetch(directoryAddress, {
      ...this.txParams,
    });
  }
}
