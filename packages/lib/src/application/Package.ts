import Logger from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { toSemanticVersion, SemanticVersion } from '../utils/Semver';
import { toAddress, isZeroAddress } from '../utils/Addresses';
import Contract from '../artifacts/Contract';
import Transactions from '../utils/Transactions';

const log: Logger = new Logger('Package');

export default class Package {
  private packageContract: Contract;
  private txParams: any;

  public static fetch(address: string, txParams: any = {}): Package | null {
    if (isZeroAddress(address)) return null;
    const PackageContact = Contracts.getFromLib('Package');
    const packageContract = PackageContact.at(address);
    return new this(packageContract, txParams);
  }

  public static async deploy(txParams: any = {}): Promise<Package> {
    log.info('Deploying new Package...');
    const PackageContract: Contract = Contracts.getFromLib('Package');
    const packageContract = await Transactions.deployContract(PackageContract, [], txParams);
    log.info(`Deployed Package ${packageContract.address}`);
    return new this(packageContract, txParams);
  }

  constructor(packageContract: Contract, txParams: any = {}) {
    this.packageContract = packageContract;
    this.txParams = txParams;
  }

  get contract(): Contract {
    return this.packageContract;
  }

  get address(): string {
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
    log.info('Adding new version...');
    const semver: SemanticVersion = toSemanticVersion(version);
    const directory: ImplementationDirectory = await ImplementationDirectory.deploy({ ...this.txParams });
    await Transactions.sendTransaction(this.packageContract.methods.addVersion, [semver, directory.address, Buffer.from(content)], { ...this.txParams });
    log.info(`Added version ${semver.join('.')}`);
    return directory;
  }

  public async getDirectory(version: string): Promise<ImplementationDirectory | never> {
    if (!version) throw Error('Cannot get a directory from a package without specifying a version');
    const directoryAddress = await this.packageContract.methods.getContract(toSemanticVersion(version)).call();
    return ImplementationDirectory.fetch(directoryAddress, { ...this.txParams });
  }
}
