import ZWeb3 from '../artifacts/ZWeb3';
import Contracts from '../artifacts/Contracts';
import { toAddress, uint256ToAddress } from '../utils/Addresses';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';

export default class Proxy {
  private contract: Contract;
  private txParams: any;
  public address: string;

  public static at(contractOrAddress: string | Contract, txParams: any = {}): Proxy {
    const ProxyContract = Contracts.getFromLib('AdminUpgradeabilityProxy');
    const contract = ProxyContract.at(toAddress(contractOrAddress));
    return new this(contract, txParams);
  }

  public static async deploy(implementation: string, admin: string, initData: string | Buffer | null, txParams: any = {}): Promise<Proxy> {
    const ProxyContract = Contracts.getFromLib('AdminUpgradeabilityProxy');
    const contractParams = [toAddress(implementation), toAddress(admin), initData || Buffer.from('')];
    const contract = await Transactions.deployContract(ProxyContract, contractParams, txParams);
    return new this(contract, txParams);
  }

  constructor(contract: Contract, txParams: any = {}) {
    this.address = toAddress(contract);
    this.contract = contract;
    this.txParams = txParams;
  }

  public async upgradeTo(address: string, migrateData: string | null): Promise<any> {
    await this.checkAdmin();
    return migrateData
      ? Transactions.sendTransaction(this.contract.methods.upgradeToAndCall, [toAddress(address), migrateData], this.txParams)
      : Transactions.sendTransaction(this.contract.methods.upgradeTo, [toAddress(address)], this.txParams);
  }

  public async changeAdmin(newAdmin: string): Promise<any> {
    await this.checkAdmin();
    return Transactions.sendTransaction(this.contract.methods.changeAdmin, [newAdmin], this.txParams);
  }

  public async implementation(): Promise<string> {
    const position = ZWeb3.sha3('org.zeppelinos.proxy.implementation');
    return uint256ToAddress(await this.getStorageAt(position));
  }

  public async admin(): Promise<string> {
    const position = ZWeb3.sha3('org.zeppelinos.proxy.admin');
    return uint256ToAddress(await this.getStorageAt(position));
  }

  public async getStorageAt(position: string): Promise<string> {
    return ZWeb3.getStorageAt(this.address, position);
  }

  private async checkAdmin(): Promise<void | never> {
    const currentAdmin: string = await this.admin();
    const { from }: { from?: string } = this.txParams;
    // TODO: If no `from` is set, load which is the default account and use it to compare against the current admin
    if (from && currentAdmin !== from) throw new Error(`Cannot modify proxy from non-admin account: current admin is ${currentAdmin} and sender is ${from}`);
  }
}
