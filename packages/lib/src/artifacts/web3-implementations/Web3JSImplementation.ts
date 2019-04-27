import NETWORKS from '../Networks';
import Logger from '../../utils/Logger';
import sleep from '../../helpers/sleep';
import Web3 from 'web3';
import { TransactionReceipt } from 'web3/types';
import { Eth, Block, Transaction } from 'web3-eth';
import { Contract } from 'web3-eth-contract';
import { toChecksumAddress } from 'web3-utils';
import ZWeb3Interface from '../ZWeb3Interface';

const log: Logger = new Logger('ZWeb3JSImplementation');

// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export default class Web3JSImplementation implements ZWeb3Interface {

	private _provider;

	constructor(provider: any) {
		this._provider = provider;
	}

	public get provider(): any {
		return this._provider
	}

	public get web3(): Web3 {
		if (!this._provider) return new Web3();

		// TODO: improve provider validation for HttpProvider scenarios
		return typeof this._provider === 'string'
			? new Web3(new Web3.providers.HttpProvider(this._provider))
			: new Web3(this._provider);
	}


	public sha3(value: string): string {
		return Web3.utils.sha3(value);
	}

	public isAddress(address: string): boolean {
		return Web3.utils.isAddress(address);
	}

	public get eth(): Eth { // GEORGETODO Probably remove this completely or leave it only when web3js version
		return this.web3.eth;
	}

	public get version(): string {
		return this.web3.version;
	}

	public contract(abi: any, atAddress?: string, options?: any): Contract {
		return new (this.eth.Contract)(abi, atAddress, options);
	}

	public async accounts(): Promise<string[]> {
		return await this.eth.getAccounts();
	}

	public async defaultAccount(): Promise<string> {
		return (await this.accounts())[0];
	}

	public toChecksumAddress(address: string): string | null {
		if (!address) return null;

		if (address.match(/[A-F]/)) {
			if (toChecksumAddress(address) !== address) {
				throw Error(`Given address \"${address}\" is not a valid Ethereum address or it has not been checksummed correctly.`);
			} else return address;
		} else {
			log.warn(`WARNING: Address ${address} is not checksummed. Consider checksumming it to avoid future warnings or errors.`);
			return toChecksumAddress(address);
		}
	}

	public async estimateGas(params: any): Promise<number> {
		return this.eth.estimateGas({ ...params });
	}

	public async getBalance(address: string): Promise<string> {
		return this.eth.getBalance(address);
	}

	public async getCode(address: string): Promise<string> {
		return this.eth.getCode(address);
	}

	public async hasBytecode(address): Promise<boolean> {
		const bytecode = await this.getCode(address);
		return bytecode.length > 2;
	}

	public async getStorageAt(address: string, position: string): Promise<string> {
		return this.eth.getStorageAt(address, position);
	}

	public async getNode(): Promise<string> {
		return this.eth.getNodeInfo();
	}

	public async isGanacheNode(): Promise<boolean> {
		const nodeVersion = await this.getNode();
		return nodeVersion.match(/TestRPC/) !== null;
	}

	public async getBlock(filter: string | number): Promise<Block> {
		return this.eth.getBlock(filter);
	}

	public async getLatestBlock(): Promise<Block> {
		return this.getBlock('latest');
	}

	public async getLatestBlockNumber(): Promise<number> {
		return (await this.getLatestBlock()).number;
	}

	public async isMainnet(): Promise<boolean> {
		return (await this.getNetworkName()) === 'mainnet';
	}

	public async getNetwork(): Promise<number> {
		return this.eth.net.getId();
	}

	public async getNetworkName(): Promise<string> {
		const networkId = await this.getNetwork();
		return NETWORKS[networkId] || `dev-${networkId}`;
	}

	public async sendTransaction(params: any): Promise<TransactionReceipt> {
		return this.eth.sendTransaction({ ...params });
	}

	public sendTransactionWithoutReceipt(params: any): Promise<string> {
		return new Promise((resolve, reject) => {
			this.eth.sendTransaction({ ...params }, (error, txHash) => {
				if (error) reject(error.message);
				else resolve(txHash);
			});
		});
	}

	public async getTransaction(txHash: string): Promise<Transaction> {
		return this.eth.getTransaction(txHash);
	}

	public async getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
		return this.eth.getTransactionReceipt(txHash);
	}

	public async getTransactionReceiptWithTimeout(txHash: string, timeout: number): Promise<TransactionReceipt> {
		return this._getTransactionReceiptWithTimeout(txHash, timeout, new Date().getTime());
	}

	private async _getTransactionReceiptWithTimeout(txHash: string, timeout: number, startTime: number): Promise<TransactionReceipt | never> {
		const receipt: any = await this._tryGettingTransactionReceipt(txHash);
		if (receipt) {
			if (receipt.status) return receipt;
			throw new Error(`Transaction: ${txHash} exited with an error (status 0).`);
		}

		await sleep(1000);
		const timeoutReached = timeout > 0 && new Date().getTime() - startTime > timeout;
		if (!timeoutReached) return await this._getTransactionReceiptWithTimeout(txHash, timeout, startTime);
		throw new Error(`Transaction ${txHash} wasn't processed in ${timeout / 1000} seconds!`);
	}

	private async _tryGettingTransactionReceipt(txHash: string): Promise<TransactionReceipt | never> {
		try {
			return await this.getTransactionReceipt(txHash);
		} catch (error) {
			if (error.message.includes('unknown transaction')) return null;
			else throw error;
		}
	}
}
