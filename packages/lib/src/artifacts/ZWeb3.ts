import { Loggy } from '../utils/Logger';
import sleep from '../helpers/sleep';
import Web3 from 'web3';
import { TransactionReceipt, Transaction } from 'web3-core';
import { Block, Eth } from 'web3-eth';
import { Contract } from 'web3-eth-contract';
import { toChecksumAddress } from 'web3-utils';

// Reference: see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md#list-of-chain-ids
export const NETWORKS = {
  1: 'mainnet',
  2: 'morden',
  3: 'ropsten',
  4: 'rinkeby',
  5: 'goerli',
  42: 'kovan',
};

export interface TxParams {
  from?: string;
  value?: number | string;
  gas?: number | string;
  gasPrice?: number | string;
}

// Patch typing for getStorageAt method -- see https://github.com/ethereum/web3.js/pull/3180
declare module 'web3-eth' {
  interface Eth {
    getStorageAt(address: string, position: number | string): Promise<string>;
  }
}

// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export default class ZWeb3 {
  public static provider;

  public static web3instance;

  public static initialize(provider: any): void {
    ZWeb3.provider = provider;
    ZWeb3.web3instance = undefined;
  }

  // TODO: this.web3 could be cached and initialized lazily?
  public static web3(forceReinit = false): any {
    if (ZWeb3.web3instance && !forceReinit) return ZWeb3.web3instance;
    if (!ZWeb3.provider) {
      ZWeb3.web3instance = new Web3(null);
      return ZWeb3.web3instance;
    } else ZWeb3.web3instance = new Web3(ZWeb3.provider);

    return ZWeb3.web3instance;
  }

  public static sha3(value: string): string {
    return Web3.utils.sha3(value);
  }

  public static isAddress(address: string): boolean {
    return Web3.utils.isAddress(address);
  }

  public static isHex(hex: string): boolean {
    return Web3.utils.isHex(hex);
  }

  public static async checkNetworkId(providedNetworkId?: string | number): Promise<void | never> {
    const networkId = await ZWeb3.getNetwork();
    if (
      providedNetworkId !== undefined &&
      providedNetworkId !== '*' &&
      Number(networkId) !== Number(providedNetworkId)
    ) {
      throw Error(`Unexpected network ID: requested ${providedNetworkId} but connected to ${networkId}`);
    }
  }

  public static eth(): Eth {
    return ZWeb3.web3().eth;
  }

  public static version(): string {
    return ZWeb3.web3().version;
  }

  public static contract(abi: any, atAddress?: string, options?: any): Contract {
    return new (ZWeb3.eth()).Contract(abi, atAddress, options);
  }

  public static async accounts(): Promise<string[]> {
    return await ZWeb3.eth().getAccounts();
  }

  public static async defaultAccount(): Promise<string> {
    return (await ZWeb3.accounts())[0];
  }

  public static toChecksumAddress(address: string): string | null {
    if (!address) return null;

    if (address.match(/[A-F]/)) {
      if (toChecksumAddress(address) !== address) {
        throw Error(
          `Given address \"${address}\" is not a valid Ethereum address or it has not been checksummed correctly.`,
        );
      } else return address;
    } else {
      Loggy.noSpin.warn(
        __filename,
        'toChecksumAddress',
        'checksum-addresses',
        `WARNING: Address ${address} is not checksummed. Consider checksumming it to avoid future warnings or errors.`,
      );
      return toChecksumAddress(address);
    }
  }

  public static async estimateGas(params: any): Promise<number> {
    return ZWeb3.eth().estimateGas({ ...params });
  }

  public static async getBalance(address: string): Promise<string> {
    return ZWeb3.eth().getBalance(address);
  }

  public static async getCode(address: string): Promise<string> {
    return ZWeb3.eth().getCode(address);
  }

  public static async hasBytecode(address): Promise<boolean> {
    const bytecode = await ZWeb3.getCode(address);
    return bytecode.length > 2;
  }

  public static async getStorageAt(address: string, position: string): Promise<string> {
    return ZWeb3.eth().getStorageAt(address, position);
  }

  public static async getNode(): Promise<string> {
    return ZWeb3.eth().getNodeInfo();
  }

  public static async isGanacheNode(): Promise<boolean> {
    const nodeVersion = await ZWeb3.getNode();
    return nodeVersion.match(/TestRPC/) !== null;
  }

  public static async getBlock(filter: string | number): Promise<Block> {
    return ZWeb3.eth().getBlock(filter);
  }

  public static async getLatestBlock(): Promise<Block> {
    return ZWeb3.getBlock('latest');
  }

  public static async getLatestBlockNumber(): Promise<number> {
    return (await ZWeb3.getLatestBlock()).number;
  }

  public static async isMainnet(): Promise<boolean> {
    return (await ZWeb3.getNetworkName()) === 'mainnet';
  }

  public static async getNetwork(): Promise<number> {
    return ZWeb3.eth().net.getId();
  }

  public static async getNetworkName(): Promise<string> {
    const networkId = await ZWeb3.getNetwork();
    return NETWORKS[networkId] || `dev-${networkId}`;
  }

  public static async sendTransaction(params: TxParams): Promise<TransactionReceipt> {
    return ZWeb3.eth().sendTransaction({ ...params });
  }

  public static sendTransactionWithoutReceipt(params: TxParams): Promise<string> {
    return new Promise((resolve, reject) => {
      ZWeb3.eth().sendTransaction({ ...params }, (error, txHash) => {
        if (error) reject(error.message);
        else resolve(txHash);
      });
    });
  }

  public static async getTransaction(txHash: string): Promise<Transaction> {
    return ZWeb3.eth().getTransaction(txHash);
  }

  public static async getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
    return ZWeb3.eth().getTransactionReceipt(txHash);
  }

  public static async getTransactionReceiptWithTimeout(tx: string, timeout: number): Promise<TransactionReceipt> {
    return ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, new Date().getTime());
  }

  private static async _getTransactionReceiptWithTimeout(
    tx: string,
    timeout: number,
    startTime: number,
  ): Promise<TransactionReceipt | never> {
    const receipt: any = await ZWeb3._tryGettingTransactionReceipt(tx);
    if (receipt) {
      if (receipt.status) return receipt;
      throw new Error(`Transaction: ${tx} exited with an error (status 0).`);
    }

    await sleep(1000);
    const timeoutReached = timeout > 0 && new Date().getTime() - startTime > timeout;
    if (!timeoutReached) return await ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, startTime);
    throw new Error(`Transaction ${tx} wasn't processed in ${timeout / 1000} seconds`);
  }

  private static async _tryGettingTransactionReceipt(tx: string): Promise<TransactionReceipt | never> {
    try {
      return await ZWeb3.getTransactionReceipt(tx);
    } catch (error) {
      if (error.message.includes('unknown transaction')) return null;
      else throw error;
    }
  }
}
