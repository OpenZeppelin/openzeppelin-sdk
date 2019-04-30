import NETWORKS from '../Networks';
import Logger from '../../utils/Logger';
import sleep from '../../helpers/sleep';
import ZWeb3Interface from '../ZWeb3Interface';
import { Provider, AsyncSendable, JsonRpcProvider, Web3Provider, Block, TransactionRequest, TransactionReceipt, TransactionResponse } from 'ethers/providers';
import { Contract as EthersContract } from 'ethers/contract';
import { Interface } from 'ethers/utils/interface';
import { Wallet } from 'ethers/wallet'
import { version } from 'ethers/_version';
import * as utils from 'ethers/utils'
import Contract from '../Contract';
import { StorageLayoutInfo } from '../../validations/Storage';
import { Signer } from 'ethers/abstract-signer';

const log: Logger = new Logger('ZWeb3EthersImplementation');



export interface IZEthersContract {

	instanceSigner: Signer;

	deploy(options: { data: string; arguments: any[]; }): any;
	methods: { [fnName: string]: (...args: any[]) => any; };

	// Contract specific.
	address: string;
	new: (args?: any[], options?: {}) => Promise<IZEthersContract>;
	at: (address: string) => Contract;
	link: (libraries: { [libAlias: string]: string }) => void;
	schema: {

		// Zos schema specific.
		directory: string;
		linkedBytecode: string;
		linkedDeployedBytecode: string;
		warnings: any;
		storageInfo: StorageLayoutInfo;

		// Solidity schema.
		schemaVersion: string;
		contractName: string;
		abi: any[];
		bytecode: string;
		deployedBytecode: string;
		sourceMap: string;
		deployedSourceMap: string;
		source: string;
		sourcePath: string;
		ast: any;
		legacyAST: any;
		compiler: any;
		networks: any;
		updatedAt: string;
	};
}

export class ZEthersContract implements IZEthersContract {
	instanceSigner: Signer;
	provider;
	address: string;
	methods;
	schema: {

		// Zos schema specific.
		directory: string;
		linkedBytecode: string;
		linkedDeployedBytecode: string;
		warnings: any;
		storageInfo: StorageLayoutInfo;

		// Solidity schema.
		schemaVersion: string;
		contractName: string;
		abi: any[];
		bytecode: string;
		deployedBytecode: string;
		sourceMap: string;
		deployedSourceMap: string;
		source: string;
		sourcePath: string;
		ast: any;
		legacyAST: any;
		compiler: any;
		networks: any;
		updatedAt: string;
	};
	interface: Interface;
	constructor(instance: Interface | EthersContract, schema: any, provider: any, instanceSigner: Signer) {
		this.schema = schema;
		this.provider = provider;
		this.instanceSigner = instanceSigner;
		if (Interface.isInterface(instance)) {
			this.interface = instance;
		}

		this.methods = this.convertFunctionsToMethods()
	}

	private convertFunctionsToMethods() {
		const methods = {}
		for (const fnDesc in Object.keys(this.interface.functions)) {
			methods[fnDesc] = this.convertFunctionToMethod(fnDesc, this.interface.functions)
		}

		return this.interface.functions;
	}

	private convertFunctionToMethod(fnDesc: string, functions: object): object {
		const call = async (params) => {
			const paramsCopy = utils.shallowCopy(params);
			const from = paramsCopy.from | 0;
			const signer = await this.provider.getSigner(from);
			delete paramsCopy.from;
			paramsCopy.value = utils.bigNumberify(paramsCopy.value);
			return functions[fnDesc](...arguments)
		}

		return {
			call
		}
	}

	new(args?: any[], options?: {}): Promise<ZEthersContract> {
		return undefined
	}

	at(address: string): ZEthersContract {
		return undefined
	}

	link(libraries: { [libAlias: string]: string }) {

	};

	deploy(options: { data: string; arguments: any[]; }): any {
		const self = this;
		return {
			encodeABI: () => {
				return self.interface.deployFunction.encode(options.data, options.arguments);
			}
		}
	}
}


// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export class EthersImplementation implements ZWeb3Interface {

	private _provider;
	private wallet: Wallet;

	constructor(providerWalletOrURL: string | Wallet | JsonRpcProvider | AsyncSendable) {
		if (typeof providerWalletOrURL === 'string') {
			this._provider = new JsonRpcProvider(providerWalletOrURL);
			return;
		}

		if (typeof providerWalletOrURL === 'object') {

			if (Wallet.isSigner(providerWalletOrURL)) {
				if (typeof (providerWalletOrURL as Wallet).provider == 'undefined') {
					throw new Error('No usable ethers provider or URL found');
				}
				this._provider = (providerWalletOrURL as Wallet).provider
				this.wallet = providerWalletOrURL;
				return;
			}

			if (JsonRpcProvider.isProvider(providerWalletOrURL)) {
				this._provider = providerWalletOrURL
				return;
			}

			if (typeof (providerWalletOrURL as AsyncSendable).send === 'function' || typeof (providerWalletOrURL as AsyncSendable).sendAsync === 'function') {
				this._provider = new Web3Provider((providerWalletOrURL as AsyncSendable));
				return;
			}
		}

		throw new Error('No usable ethers provider or URL found');

	}

	public get provider(): JsonRpcProvider {
		return this._provider
	}

	public get web3(): JsonRpcProvider {
		return this._provider;
	}

	public sha3(value: string): string {
		return utils.keccak256(utils.toUtf8Bytes(value));
	}

	public isAddress(address: string): boolean {
		try {
			utils.getAddress(address); // ethers throws if the supplied argument is not an address
		} catch (e) {
			return false
		}
		return true
	}

	public get eth(): Provider {
		return this.provider;
	}

	public get version(): string {
		return version;
	}

	public contract(abi: any, atAddress?: string, options?: any): Interface | EthersContract {
		// return new Contract()
		return new Interface(abi) // Check the web3.eth.contract implementation for details on atAddress and options
	}

	public wrapContractInstance(schema: any, instance: Interface | EthersContract): ZEthersContract {
		return undefined;
	}

	public async accounts(): Promise<string[]> {
		return (this.provider as JsonRpcProvider).listAccounts()
	}

	public async defaultAccount(): Promise<string> {
		return (await this.accounts())[0];
	}

	public toChecksumAddress(address: string): string | null {
		return utils.getAddress(address);
	}

	public async estimateGas(params: TransactionRequest): Promise<number> {
		const gasBN = await this.provider.estimateGas(params);
		return gasBN.toNumber();
	}

	public async getBalance(address: string): Promise<string> {
		const balanceBN = await this.provider.getBalance(address);
		return balanceBN.toString()
	}

	public async getCode(address: string): Promise<string> {
		return this.provider.getCode(address);
	}

	public async hasBytecode(address): Promise<boolean> {
		const bytecode = await this.getCode(address);
		return bytecode.length > 2;
	}

	public async getStorageAt(address: string, position: string): Promise<string> {
		return this.provider.getStorageAt(address, position);
	}

	public async getNode(): Promise<string> {
		return this.provider.send('web3_clientVersion', []);
	}

	public async isGanacheNode(): Promise<boolean> {
		const nodeVersion = await this.getNode();
		return nodeVersion.match(/TestRPC/) !== null;
	}

	public async getBlock(filter: string | number): Promise<Block> {
		return this.provider.getBlock(filter);
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
		const network = await this.provider.getNetwork();
		return network.chainId;
	}

	public async getNetworkName(): Promise<string> {
		const networkId = await this.getNetwork();
		return NETWORKS[networkId] || `dev-${networkId}`;
	}

	private async _sendTransaction(params: any): Promise<TransactionResponse> {
		const paramsCopy = utils.shallowCopy(params);
		const from = paramsCopy.from | 0;
		const signer = await this.provider.getSigner(from);
		delete paramsCopy.from;
		paramsCopy.value = utils.bigNumberify(paramsCopy.value);
		const txResponse = await signer.sendTransaction((paramsCopy as TransactionRequest));
		return txResponse;
	}

	public async sendTransaction(params: any): Promise<TransactionReceipt> {
		const txResponse = await this._sendTransaction(params);
		return txResponse.wait()
	}

	public async sendTransactionWithoutReceipt(params: any): Promise<string> {
		const txResponse = await this._sendTransaction(params);
		return txResponse.hash;
	}

	public async getTransaction(txHash: string): Promise<TransactionResponse> {
		return this.provider.getTransaction(txHash);
	}

	public async getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
		return this.provider.getTransactionReceipt(txHash);
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
