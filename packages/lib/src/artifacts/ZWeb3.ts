import { promisify } from 'util';
import sleep from '../helpers/sleep';
import BN from 'bignumber.js';
import Web3 from 'web3';

// Reference: see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md#list-of-chain-ids
const NETWORKS = {
  1:  'mainnet',
  2:  'morden',
  3:  'ropsten',
  4:  'rinkeby',
  42: 'kovan'
};

// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export default class ZWeb3 {

  public static provider: Web3.Provider | string;

  public static initialize(provider: Web3.Provider | string): void {
    ZWeb3.provider = provider;
  }

  // TODO: this.web3 could be cached and initialized lazily?
  public static web3(): Web3 {
    if (!ZWeb3.provider) throw new Error('ZWeb3 must be initialized with a web3 provider');

    // TODO: improve provider validation for HttpProvider scenarios
    if (typeof ZWeb3.provider === 'string') {
      const provider = new Web3.providers.HttpProvider(ZWeb3.provider);
      return new Web3(provider);
    }
    return new Web3(ZWeb3.provider);
  }

  public static sha3(value: string): string {
    return ZWeb3.web3().sha3(value);
  }

  public static isAddress(address: string): boolean {
    return ZWeb3.web3().isAddress(address);
  }

  public static eth(): Web3.EthApi {
    return ZWeb3.web3().eth;
  }

  public static version(): Web3.VersionApi {
    return ZWeb3.web3().version;
  }

  public static contract(abi: Web3.AbiDefinition[]): Web3.Contract<any> {
    return ZWeb3.eth().contract(abi);
  }

  public static async accounts(): Promise<string[]> {
    return promisify(
      ZWeb3.eth().getAccounts.bind(ZWeb3.eth())
    )();
  }

  public static async defaultAccount(): Promise<string> {
    return (await ZWeb3.accounts())[0];
  }

  public static async estimateGas(params: Web3.CallData): Promise<number> {
    return promisify(
      ZWeb3.eth().estimateGas.bind(ZWeb3.eth())
    )(params);
  }

  public static async getBalance(address: string): Promise<string> {
    return promisify(
      ZWeb3.eth().getBalance.bind(ZWeb3.eth())
    )(address);
  }

  public static async getCode(address: string): Promise<string> {
    return promisify(
      ZWeb3.eth().getCode.bind(ZWeb3.eth())
    )(address);
  }

  public static async hasBytecode(address): Promise<boolean> {
    const bytecode = await ZWeb3.getCode(address);
    return bytecode.length > 2;
  }

  public static async getStorageAt(address: string, position: string): Promise<string> {
    return promisify(
      ZWeb3.eth().getStorageAt.bind(ZWeb3.eth())
    )(address, position);
  }

  public static async getNode(): Promise<string> {
    return promisify(
      ZWeb3.version().getNode.bind(ZWeb3.version())
    )();
  }

  public static async isGanacheNode(): Promise<RegExpMatchArray> {
    const nodeVersion = await ZWeb3.getNode();
    return nodeVersion.match(/TestRPC/);
  }

  public static async getBlock(filter: string | number): Promise<Web3.BlockWithoutTransactionData> {
    return promisify(
      ZWeb3.eth().getBlock.bind(ZWeb3.eth())
    )(filter);
  }

  public static async getLatestBlock(): Promise<Web3.BlockWithoutTransactionData> {
    return ZWeb3.getBlock('latest');
  }

  public static async getLatestBlockNumber(): Promise<number> {
    return (await ZWeb3.getLatestBlock()).number;
  }

  public static async isMainnet(): Promise<boolean> {
    return (await ZWeb3.getNetworkName()) === 'mainnet';
  }

  public static async getNetwork(): Promise<string> {
    return promisify(
      ZWeb3.version().getNetwork.bind(ZWeb3.version())
    )();
  }

  public static async getNetworkName(): Promise<string> {
    const networkId = await ZWeb3.getNetwork();
    return NETWORKS[networkId] || `dev-${networkId}`;
  }

  public static async sendTransaction(params: Web3.TxData): Promise<string> {
    return promisify(
      ZWeb3.eth().sendTransaction.bind(ZWeb3.eth())
    )(params);
  }

  public static async getTransaction(txHash: string): Promise<Web3.Transaction> {
    return promisify(
      ZWeb3.eth().getTransaction.bind(ZWeb3.eth())
    )(txHash);
  }

  public static async getTransactionReceipt(txHash: string): Promise<Web3.TransactionReceipt | null> {
    return promisify(
      ZWeb3.eth().getTransactionReceipt.bind(ZWeb3.eth())
    )(txHash);
  }

  public static async getTransactionReceiptWithTimeout(tx: string, timeout: number): Promise<Web3.TransactionReceipt | null> {
    return ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, new Date().getTime());
  }

  private static async _getTransactionReceiptWithTimeout(tx: string, timeout: number, startTime: number): Promise<Web3.TransactionReceipt | null | never> {
    const receipt: any = await ZWeb3._tryGettingTransactionReceipt(tx);
    if (receipt) {
      if (parseInt(receipt.status, 16) !== 0) return receipt;
      throw new Error(`Transaction: ${tx} exited with an error (status 0).`);
    }

    await sleep(1000);
    const timeoutReached = timeout > 0 && new Date().getTime() - startTime > timeout;
    if (!timeoutReached) return await ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, startTime);
    throw new Error(`Transaction ${tx} wasn't processed in ${timeout / 1000} seconds!`);
  }

  private static async _tryGettingTransactionReceipt(tx: string): Promise<Web3.TransactionReceipt | null | never> {
    try {
      return await ZWeb3.getTransactionReceipt(tx);
    } catch (error) {
      if (error.message.includes('unknown transaction')) return null;
      else throw error;
    }
  }
}
