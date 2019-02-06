import Proxy from '../proxy/Proxy';
import Logger from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import { toAddress } from '../utils/Addresses';
import { buildCallData, callDescription, CalldataInfo } from '../utils/ABIs';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';

const log: Logger = new Logger('ProxyAdmin');

export default class ProxyAdmin {
  public contract: Contract;
  public address: string;
  public txParams: any;

  public static fetch(address: string, txParams: any = {}): ProxyAdmin {
    const contract = Contracts.getFromLib('ProxyAdmin').at(address);
    return new this(contract, txParams);
  }

  public static async deploy(txParams: any = {}): Promise<ProxyAdmin> {
    log.info('Deploying new ProxyAdmin...');
    const contract = await Transactions.deployContract(Contracts.getFromLib('ProxyAdmin'), [], txParams);
    log.info(`Deployed ProxyAdmin at ${contract.address}`);
    return new this(contract, txParams);
  }

  constructor(contract: any, txParams: any = {}) {
    this.contract = contract;
    this.address = toAddress(contract);
    this.txParams = txParams;
  }

  public async getProxyImplementation(proxyAddress: string): Promise<string> {
    return this.contract.methods.getProxyImplementation(proxyAddress).call({ ...this.txParams });
  }

  public async changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void> {
    log.info(`Changing admin for proxy ${proxyAddress} to ${newAdmin}...`);
    await Transactions.sendTransaction(this.contract.methods.changeProxyAdmin, [proxyAddress, newAdmin], { ...this.txParams });
    log.info(`Admin for proxy ${proxyAddress} set to ${newAdmin}`);
  }

  public async upgradeProxy(proxyAddress: string, implementationAddress: string, contract: Contract, initMethodName: string, initArgs: any): Promise<Contract> {
    const receipt: any = typeof(initArgs) === 'undefined'
      ? await this._upgradeProxy(proxyAddress, implementationAddress)
      : await this._upgradeProxyAndCall(proxyAddress, implementationAddress, contract, initMethodName, initArgs);
    log.info(`TX receipt received: ${receipt.transactionHash}`);
    return contract.at(proxyAddress);
  }

  private async _upgradeProxy(proxyAddress: string, implementation: string): Promise<any> {
    log.info(`Upgrading proxy at ${proxyAddress} without running migrations...`);
    return Transactions.sendTransaction(this.contract.methods.upgrade, [proxyAddress, implementation], { ...this.txParams });
  }

  private async _upgradeProxyAndCall(proxyAddress: string, implementationAddress: string, contract: any, initMethodName: string, initArgs: any): Promise<any> {
    const { method: initMethod, callData }: CalldataInfo = buildCallData(contract, initMethodName, initArgs);
    log.info(`Upgrading proxy at ${proxyAddress} and calling ${callDescription(initMethod, initArgs)}...`);
    return Transactions.sendTransaction(this.contract.methods.upgradeAndCall, [proxyAddress, implementationAddress, callData], { ...this.txParams });
  }
}
