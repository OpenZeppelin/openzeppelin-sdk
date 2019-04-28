import IMPLEMENTATIONS from './web3-implementations/Implementations';
import Web3JSImplementation from './web3-implementations/Web3JSImplementation';
import ZWeb3Interface from './ZWeb3Interface';

// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export default class ZWeb3 {

  public static provider; // GORGETODO add implementation classes. The two classes should have constructor receiving the provider and all methods described below in the context of the implementation
  public static implementation: ZWeb3Interface;

  public static initialize(provider: any, implementation: IMPLEMENTATIONS = IMPLEMENTATIONS.WEB3JS): void { // GORGETODO add second param for library, defaulting to web3.js
    ZWeb3.provider = provider;
    switch (implementation) {
      case IMPLEMENTATIONS.WEB3JS:
        ZWeb3.implementation = new Web3JSImplementation(provider)
        break;
    }
  }

  // TODO: this.web3 could be cached and initialized lazily?
  public static web3(): any {
    return ZWeb3.implementation.web3
  }

  public static sha3(value: string): string {
    return ZWeb3.implementation.sha3(value);
  }

  public static isAddress(address: string): boolean {
    return ZWeb3.implementation.isAddress(address);
  }

  public static eth(): any { // GEORGETODO Probably remove this completely or leave it only when web3js version
    return ZWeb3.implementation.eth;
  }

  public static version(): string {
    return ZWeb3.implementation.version;
  }

  public static contract(abi: any, atAddress?: string, options?: any): any {
    return ZWeb3.implementation.contract(abi, atAddress, options);
  }

  public static async accounts(): Promise<string[]> {
    return await ZWeb3.implementation.accounts();
  }

  public static async defaultAccount(): Promise<string> {
    return await ZWeb3.implementation.defaultAccount();
  }

  public static toChecksumAddress(address: string): string | null {
    return ZWeb3.implementation.toChecksumAddress(address);
  }

  public static async estimateGas(params: any): Promise<number> {
    return ZWeb3.implementation.estimateGas(params);
  }

  public static async getBalance(address: string): Promise<string> {
    return ZWeb3.implementation.getBalance(address);
  }

  public static async getCode(address: string): Promise<string> {
    return ZWeb3.implementation.getCode(address);
  }

  public static async hasBytecode(address): Promise<boolean> {
    return ZWeb3.implementation.hasBytecode(address)
  }

  public static async getStorageAt(address: string, position: string): Promise<string> {
    return ZWeb3.implementation.getStorageAt(address, position);
  }

  public static async getNode(): Promise<string> {
    return ZWeb3.implementation.getNode()
  }

  public static async isGanacheNode(): Promise<boolean> {
    return ZWeb3.implementation.isGanacheNode()
  }

  public static async getBlock(filter: string | number): Promise<any> {
    return ZWeb3.implementation.getBlock(filter);
  }

  public static async getLatestBlock(): Promise<any> {
    return ZWeb3.implementation.getLatestBlock();
  }

  public static async getLatestBlockNumber(): Promise<number> {
    return ZWeb3.implementation.getLatestBlockNumber();
  }

  public static async isMainnet(): Promise<boolean> {
    return ZWeb3.implementation.isMainnet();
  }

  public static async getNetwork(): Promise<number> {
    return ZWeb3.implementation.getNetwork();
  }

  public static async getNetworkName(): Promise<string> {
    return ZWeb3.implementation.getNetworkName()
  }

  public static async sendTransaction(params: any): Promise<any> {
    return ZWeb3.implementation.sendTransaction(params);
  }

  public static sendTransactionWithoutReceipt(params: any): Promise<string> {
    return ZWeb3.implementation.sendTransactionWithoutReceipt(params);
  }

  public static async getTransaction(txHash: string): Promise<any> {
    return ZWeb3.implementation.getTransaction(txHash);
  }

  public static async getTransactionReceipt(txHash: string): Promise<any> {
    return ZWeb3.implementation.getTransactionReceipt(txHash);
  }

  public static async getTransactionReceiptWithTimeout(txHash: string, timeout: number): Promise<any> {
    return ZWeb3.implementation.getTransactionReceiptWithTimeout(txHash, timeout)
  }
}
