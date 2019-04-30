import Contract from "./Contract";

export default interface ZWeb3Interface {
	provider: any;
	web3: any;
	sha3(value: string): string;
	isAddress(address: string): boolean;
	eth: any;
	version: string;
	contract(abi: any, atAddress?: string, options?: any): any;
	wrapContractInstance(schema: any, instance: any): Contract;
	accounts(): Promise<string[]>;
	defaultAccount(): Promise<string>;
	toChecksumAddress(address: string): string | null;
	estimateGas(params: any): Promise<number>;
	getBalance(address: string): Promise<string>;
	getCode(address: string): Promise<string>;
	hasBytecode(address): Promise<boolean>;
	getStorageAt(address: string, position: string): Promise<string>;
	getNode(): Promise<string>;
	isGanacheNode(): Promise<boolean>;
	getBlock(filter: string | number): Promise<any>;
	getLatestBlock(): Promise<any>;
	getLatestBlockNumber(): Promise<number>;
	isMainnet(): Promise<boolean>;
	getNetwork(): Promise<number>;
	getNetworkName(): Promise<string>;
	sendTransaction(params: any): Promise<any>;
	sendTransactionWithoutReceipt(params: any): Promise<string>;
	getTransaction(txHash: string): Promise<any>;
	getTransactionReceipt(txHash: string): Promise<any>;
	getTransactionReceiptWithTimeout(tx: string, timeout: number): Promise<any>;
}