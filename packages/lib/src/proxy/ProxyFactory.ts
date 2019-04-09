import Logger from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import { toAddress } from '../utils/Addresses';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';
import Proxy from './Proxy';

const log: Logger = new Logger('ProxyFactory');

export default class ProxyFactory {
  public contract: Contract;
  public address: string;
  public txParams: any;

  public static tryFetch(address: string, txParams: any = {}): ProxyFactory | null {
    return address ? this.fetch(address, txParams) : null;
  }

  public static fetch(address: string, txParams: any = {}): ProxyFactory {
    const contract = Contracts.getFromLib('ProxyFactory').at(address);
    return new this(contract, txParams);
  }

  public static async deploy(txParams: any = {}): Promise<ProxyFactory> {
    log.info('Deploying new ProxyFactory...');
    const contract = await Transactions.deployContract(Contracts.getFromLib('ProxyFactory'), [], txParams);
    log.info(`Deployed ProxyFactory at ${contract.address}`);
    return new this(contract, txParams);
  }

  constructor(contract: any, txParams: any = {}) {
    this.contract = contract;
    this.address = toAddress(contract);
    this.txParams = txParams;
  }

  public async createProxy(salt: string, logicAddress: string, proxyAdmin: string, initData?: string, signature?: string): Promise<Proxy> {
    const args = [salt, logicAddress, proxyAdmin, initData || Buffer.from('')];
    const method = signature ? this.contract.methods.deploySigned : this.contract.methods.deploy;
    if (signature) args.push(signature);

    const { events, transactionHash } = await Transactions.sendTransaction(method, args, { ...this.txParams });

    if (!events.ProxyCreated) {
      throw new Error(`Could not retrieve proxy deployment address from transaction ${transactionHash}`);
    }

    const address = events.ProxyCreated.returnValues.proxy;
    return Proxy.at(address, this.txParams);
  }

  public async getSigner(salt: string, logicAddress: string, proxyAdmin: string, initData: string, signature: string): Promise<string> {
    return this.contract.methods.getSigner(salt, logicAddress, proxyAdmin, initData || Buffer.from(''), signature).call();
  }

  public async getDeploymentAddress(salt: string, sender?: string): Promise<string> {
    const actualSender = sender || await this.getDefaultSender();
    return this.contract.methods.getDeploymentAddress(salt, actualSender).call();
  }

  public async getDefaultSender(): Promise<string> {
    return this.txParams.from || (await Contracts.getDefaultFromAddress());
  }
}
