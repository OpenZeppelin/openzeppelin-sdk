import { Loggy } from '../utils/Logger';
import Contracts from '../artifacts/Contracts';
import { toAddress } from '../utils/Addresses';
import Transactions from '../utils/Transactions';
import Contract from '../artifacts/Contract';
import Proxy from './Proxy';
import { TxParams } from '../artifacts/ZWeb3';
import MinimalProxy from './MinimalProxy';

export default class ProxyFactory {
  public contract: Contract;
  public address: string;
  public txParams: TxParams;

  public static tryFetch(address: string, txParams: TxParams = {}): ProxyFactory | null {
    return address ? this.fetch(address, txParams) : null;
  }

  public static fetch(address: string, txParams: TxParams = {}): ProxyFactory {
    const contract = Contracts.getFromLib('ProxyFactory').at(address);
    return new this(contract, txParams);
  }

  public static async deploy(txParams: TxParams = {}): Promise<ProxyFactory> {
    Loggy.spin(__filename, 'deploy', 'deploy-proxy-factory', 'Deploying new ProxyFactory contract');
    const contract = await Transactions.deployContract(Contracts.getFromLib('ProxyFactory'), [], txParams);
    Loggy.succeed('deploy-proxy-factory', `Deployed ProxyFactory at ${contract.address}`);
    return new this(contract, txParams);
  }

  public constructor(contract: any, txParams: TxParams = {}) {
    this.contract = contract;
    this.address = toAddress(contract);
    this.txParams = txParams;
  }

  public async createMinimalProxy(logicAddress: string, initData?: string): Promise<MinimalProxy> {
    const args = [logicAddress, initData || Buffer.from('')];
    const { events, transactionHash } = await Transactions.sendTransaction(this.contract.methods.deployMinimal, args, {
      ...this.txParams,
    });

    if (!events.ProxyCreated) {
      throw new Error(`Could not retrieve proxy deployment address from transaction ${transactionHash}`);
    }

    const address = events.ProxyCreated.returnValues.proxy;
    return MinimalProxy.at(address);
  }

  public async createProxy(
    salt: string,
    logicAddress: string,
    proxyAdmin: string,
    initData?: string,
    signature?: string,
  ): Promise<Proxy> {
    const args = [salt, logicAddress, proxyAdmin, initData || Buffer.from('')];
    const method = signature ? this.contract.methods.deploySigned : this.contract.methods.deploy;
    if (signature) args.push(signature);

    const { events, transactionHash } = await Transactions.sendTransaction(method, args, { ...this.txParams });

    if (!events.ProxyCreated) {
      throw new Error(`Could not retrieve proxy deployment address from transaction ${transactionHash}`);
    }

    const address = (events.ProxyCreated.returnValues || events.ProxyCreated[0].returnValues).proxy;
    return Proxy.at(address, this.txParams);
  }

  public async getSigner(
    salt: string,
    logicAddress: string,
    proxyAdmin: string,
    initData: string,
    signature: string,
  ): Promise<string> {
    return this.contract.methods
      .getSigner(salt, logicAddress, proxyAdmin, initData || Buffer.from(''), signature)
      .call();
  }

  public async getDeploymentAddress(salt: string, sender?: string): Promise<string> {
    const actualSender = sender || (await this.getDefaultSender());
    return this.contract.methods.getDeploymentAddress(salt, actualSender).call();
  }

  public async getDefaultSender(): Promise<string> {
    return this.txParams.from || (await Contracts.getDefaultFromAddress());
  }
}
