import { Loggy } from '../utils/Logger';
import sleep from '../helpers/sleep';
import Web3 from 'web3';
import { TransactionReceipt, provider } from 'web3-core';
import { Block, Eth } from 'web3-eth';
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

// TS-TODO: Review what could be private in this class.
export default class ZWeb3 {
  public static provider: provider;

  public static web3instance: Web3;

  public static initialize(provider: provider): void {
    ZWeb3.provider = provider;
    ZWeb3.web3instance = undefined;
  }

  public static get web3(): Web3 {
    if (ZWeb3.web3instance === undefined) {
      ZWeb3.web3instance = new Web3(ZWeb3.provider ?? null);
    }

    return ZWeb3.web3instance;
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

  public static get eth(): Eth {
    return ZWeb3.web3.eth;
  }

  public static get version(): string {
    return ZWeb3.web3.version;
  }

  public static async defaultAccount(): Promise<string> {
    return (await ZWeb3.eth.getAccounts())[0];
  }

  public static toChecksumAddress(address: string): string | null {
    if (!address) return null;

    if (address.match(/[A-F]/)) {
      if (toChecksumAddress(address) !== address) {
        throw Error(
          `Given address \"${address}\" is not a valid Ethereum address or it has not been checksummed correctly.`,
        );
      } else {
        return address;
      }
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

  public static async hasBytecode(address): Promise<boolean> {
    const bytecode = await ZWeb3.eth.getCode(address);
    return bytecode.length > 2;
  }

  public static async isGanacheNode(): Promise<boolean> {
    const nodeVersion = await ZWeb3.eth.getNodeInfo();
    return nodeVersion.match(/TestRPC/) !== null;
  }

  public static async getLatestBlock(): Promise<Block> {
    return ZWeb3.eth.getBlock('latest');
  }

  public static async getLatestBlockNumber(): Promise<number> {
    return (await ZWeb3.getLatestBlock()).number;
  }

  public static async isMainnet(): Promise<boolean> {
    return (await ZWeb3.getNetworkName()) === 'mainnet';
  }

  public static async getNetwork(): Promise<number> {
    return ZWeb3.eth.net.getId();
  }

  public static async getNetworkName(): Promise<string> {
    const networkId = await ZWeb3.getNetwork();
    return NETWORKS[networkId] || `dev-${networkId}`;
  }

  public static sendTransactionWithoutReceipt(params: TxParams): Promise<string> {
    return new Promise((resolve, reject): void => {
      ZWeb3.eth.sendTransaction({ ...params }, (error, txHash): void => {
        if (error) {
          reject(error.message);
        } else {
          resolve(txHash);
        }
      });
    });
  }

  public static async getTransactionReceiptWithTimeout(tx: string, timeout: number): Promise<TransactionReceipt> {
    return ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, new Date().getTime());
  }

  private static async _getTransactionReceiptWithTimeout(
    tx: string,
    timeout: number,
    startTime: number,
  ): Promise<TransactionReceipt | undefined> {
    const receipt = await ZWeb3._tryGettingTransactionReceipt(tx);
    if (receipt) {
      if (receipt.status) return receipt;
      throw new Error(`Transaction: ${tx} exited with an error (status 0).`);
    }

    await sleep(1000);
    const timeoutReached = timeout > 0 && new Date().getTime() - startTime > timeout;
    if (!timeoutReached) return await ZWeb3._getTransactionReceiptWithTimeout(tx, timeout, startTime);
    throw new Error(`Transaction ${tx} wasn't processed in ${timeout / 1000} seconds`);
  }

  private static async _tryGettingTransactionReceipt(tx: string): Promise<TransactionReceipt | undefined> {
    try {
      return await ZWeb3.eth.getTransactionReceipt(tx);
    } catch (error) {
      if (error.message.includes('unknown transaction')) {
        return undefined;
      } else {
        throw error;
      }
    }
  }
}
