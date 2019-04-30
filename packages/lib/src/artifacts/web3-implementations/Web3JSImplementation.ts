import NETWORKS from '../Networks';
import Logger from '../../utils/Logger';
import sleep from '../../helpers/sleep';
import Web3 from 'web3';
import { TransactionReceipt, Callback, EventLog, EventEmitter } from 'web3/types';
import { Eth, Block, Transaction } from 'web3-eth';
import { Contract as Web3Contract } from 'web3-eth-contract';
import Contract from '../Contract';
import { toChecksumAddress } from 'web3-utils';
import ZWeb3Interface from '../ZWeb3Interface';
import { TransactionObject, BlockType } from 'web3/eth/types';
import { StorageLayoutInfo } from '../../validations/Storage';
import Contracts from '../Contracts';

const log: Logger = new Logger('ZWeb3JSImplementation');

export interface ZWeb3JSContract {

	// Web3 Contract interface.
	options: any;
	methods: { [fnName: string]: (...args: any[]) => TransactionObject<any>; };
	deploy(options: { data: string; arguments: any[]; }): TransactionObject<Web3Contract>; // GEORGETODO Change the return type
	events: {
		[eventName: string]: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
		allEvents: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
	};
	getPastEvents(event: string, options?: { filter?: object; fromBlock?: BlockType; toBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog[]>): Promise<EventLog[]>;
	setProvider(provider: any): void;

	// Contract specific.
	address: string;
	new: (args?: any[], options?: {}) => Promise<Contract>;
	at: (address: string) => Contract;
	link: (libraries: { [libAlias: string]: string }) => void;
	deployment?: { transactionHash: string, transactionReceipt: TransactionReceipt };
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


// TS-TODO: Type Web3.
// TS-TODO: Review what could be private in this class.
export class Web3JSImplementation implements ZWeb3Interface {

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

	public contract(abi: any, atAddress?: string, options?: any): Eth.Contract {
		return new (this.eth.Contract)(abi, atAddress, options);
	}

	public wrapContractInstance(schema: any, instance: Web3Contract): ZWeb3JSContract {
		const self = this;
		instance.schema = schema;

		instance.new = async function (...passedArguments): Promise<Contract> {
			const [args, options] = self.parseArguments(passedArguments, schema.abi);
			if (!schema.linkedBytecode) throw new Error(`${schema.contractName} bytecode contains unlinked libraries.`);
			instance.options = { ...instance.options, ...(await Contracts.getDefaultTxParams()) };
			return new Promise((resolve, reject) => {
				const tx = instance.deploy({ data: schema.linkedBytecode, arguments: args });
				let transactionReceipt, transactionHash;
				tx.send({ ...options })
					.on('error', (error) => reject(error))
					.on('receipt', (receipt) => transactionReceipt = receipt)
					.on('transactionHash', (hash) => transactionHash = hash)
					.then((deployedInstance) => { // instance != deployedInstance
						deployedInstance = self.wrapContractInstance(schema, deployedInstance);
						deployedInstance.deployment = { transactionReceipt, transactionHash };
						resolve(deployedInstance);
					})
					.catch((error) => reject(error));
			});
		};

		instance.at = function (address: string): Contract | never {
			if (!self.isAddress(address)) throw new Error('Given address is not valid: ' + address);
			const newWeb3Instance = instance.clone();
			newWeb3Instance._address = address;
			newWeb3Instance.options.address = address;
			return self.wrapContractInstance(instance.schema, newWeb3Instance);
		};

		instance.link = function (libraries: { [libAlias: string]: string }): void {
			instance.schema.linkedBytecode = instance.schema.bytecode;
			instance.schema.linkedDeployedBytecode = instance.schema.deployedBytecode;

			Object.keys(libraries).forEach((name: string) => {
				const address = libraries[name].replace(/^0x/, '');
				const regex = new RegExp(`__${name}_+`, 'g');
				instance.schema.linkedBytecode = instance.schema.linkedBytecode.replace(regex, address);
				instance.schema.linkedDeployedBytecode = instance.schema.linkedDeployedBytecode.replace(regex, address);
			});
		};

		// TODO: Remove after web3 adds the getter: https://github.com/ethereum/web3.js/issues/2274
		if (typeof instance.address === 'undefined') {
			Object.defineProperty(instance, 'address', { get: () => instance.options.address });
		}

		return instance;
	}

	private parseArguments(passedArguments, abi) {
		const constructorAbi = abi.find((elem) => elem.type === 'constructor') || {};
		const constructorArgs = constructorAbi.inputs && constructorAbi.inputs.length > 0 ? constructorAbi.inputs : [];
		let givenOptions = {};

		if (passedArguments.length === constructorArgs.length + 1) {
			const lastArg = passedArguments[passedArguments.length - 1];
			if (typeof (lastArg) === 'object') {
				givenOptions = passedArguments.pop();
			}
		}
		return [passedArguments, givenOptions];
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
