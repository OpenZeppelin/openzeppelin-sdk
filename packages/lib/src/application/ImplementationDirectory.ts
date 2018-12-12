import Logger from '../utils/Logger';
import { sendTransaction, deploy } from '../utils/Transactions';
import Contracts from '../artifacts/Contracts';
import ContractFactory, { ContractWrapper } from '../artifacts/ContractFactory';

const log = new Logger('ImplementationDirectory');

// TS-TODO: This is the ABI of ImplementationDirectory.sol.
// These could be collected at a common location in the package.
interface DirectoryContract extends ContractWrapper {
  [id:string]: any;
  getImplementation:(contractName:string, txParams:any) => string;
  owner:(txParams:any) => string;
}

// TS-TODO: review which members could be private
export default class ImplementationDirectory {

  public directoryContract:DirectoryContract;
  public txParams:any;

  public static async deploy(txParams:any = {}):Promise<ImplementationDirectory> {
    const contractClass:ContractFactory = this.getContractClass();
    log.info(`Deploying new ${contractClass.contractName}...`);
    const directory:DirectoryContract = await deploy(contractClass, [], txParams);
    log.info(`Deployed ${contractClass.contractName} at ${directory.address}`);
    return new this(directory, txParams);
  }

  public static async fetch(address:string, txParams:any = {}):Promise<ImplementationDirectory> {
    const klazz:ContractFactory = this.getContractClass();
    const directory:DirectoryContract = <DirectoryContract>await klazz.at(address);
    return new this(directory, txParams);
  }

  public static getContractClass():ContractFactory {
    return Contracts.getFromLib('ImplementationDirectory');
  }

  constructor(directory:DirectoryContract, txParams:any = {}) {
    this.directoryContract = directory;
    this.txParams = txParams;
  }

  get contract():DirectoryContract {
    return this.directoryContract;
  }

  get address():string {
    return this.directoryContract.address;
  }

  public async owner():Promise<string> {
    return this.directoryContract.owner(this.txParams);
  }

  public async getImplementation(contractName:string):Promise<string> | never {
    if (!contractName) { throw Error('Contract name is required to retrieve an implementation'); }
    return await this.directoryContract.getImplementation(contractName, this.txParams);
  }

  public async setImplementation(contractName:string, implementationAddress:string):Promise<any> {
    log.info(`Setting ${contractName} implementation ${implementationAddress}...`);
    await sendTransaction(this.directoryContract.setImplementation, [contractName, implementationAddress], this.txParams);
    log.info(`Implementation set ${implementationAddress}`);
  }

  public async unsetImplementation(contractName:string):Promise<any> {
    log.info(`Unsetting ${contractName} implementation...`);
    await sendTransaction(this.directoryContract.unsetImplementation, [contractName], this.txParams);
    log.info(`${contractName} implementation unset`);
  }

  public async freeze():Promise<any> {
    log.info('Freezing implementation directory...');
    await sendTransaction(this.directoryContract.freeze, [], this.txParams);
    log.info('Frozen');
  }

  public async isFrozen():Promise<boolean> {
    return await this.directoryContract.frozen();
  }
}
