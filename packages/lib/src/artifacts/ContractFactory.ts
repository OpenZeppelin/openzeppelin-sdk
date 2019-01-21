import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { StorageLayoutInfo } from '../validations/Storage';
import { Contract, TransactionObject } from 'web3-eth-contract';
import Contracts from './Contracts';
import _ from 'lodash';

interface ContractSchema {
  contractName: string;
  abi: any;
  ast: any;
  bytecode: string;
  deployedBytecode: string;
}

export interface ContractWrapper {
  instance: any;
  address: string;
  transactionHash: string;
  allEvents: any;
  sendTransaction?: (txParams: any) => Promise<TransactionReceiptWrapper>;
  send?: (value: any) => Promise<string>;
  methods: { [fnName: string]: (...args: any[]) => TransactionObject<any> };
  constructor: any;
}

export interface TransactionReceiptWrapper {
  tx: string;
  receipt: any;
}

// TS-TODO: Review which members could be private.
export default class ContractFactory {

  public abi: any;
  public ast: any;
  public bytecode: string;
  public deployedBytecode: string;
  public contractName: string;
  public timeout: number;
  public txParams: any;
  public binary: string;
  public deployedBinary: string;
  public events: any;
  public storageInfo: StorageLayoutInfo;
  public warnings: any;

  constructor(schema: ContractSchema, timeout) {
    this.abi = schema.abi;
    this.ast = schema.ast;
    this.bytecode = schema.bytecode;
    this.deployedBytecode = schema.deployedBytecode;
    this.contractName = schema.contractName;
    this.timeout = timeout;
    this._parseEvents();
    this._setBinaryIfPossible();
  }

  public async new(...passedArguments): Promise<ContractWrapper> {
    this._validateNonEmptyBinary();
    this._validateNonUnlinkedLibraries();

    const [args, txParams] = await this._parseArguments(passedArguments);
    if (!txParams.data) txParams.data = this.binary;

    const self = this;

    return new Promise(function(resolve, reject) {
      const contractClass: Contract = ZWeb3.contract(self.abi, null, txParams);
      const tx = contractClass.deploy({data: txParams.data, arguments: args});
      let transactionHash;
      tx.send(txParams)
        .on('error', (error) => reject(error))
        .on('transactionHash', (txHash) => transactionHash = txHash)
        .then((instance) => {
          const wrapper: ContractWrapper = self._wrapContract(instance, transactionHash);
          resolve(wrapper);
        })
        .catch((error) => reject(error));
    });
  }

  public at(address: string): ContractWrapper | never {
    if (!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
    const defaults = Contracts.getArtifactsDefaults();
    const contractClass: any = ZWeb3.contract(this.abi, address, defaults);
    return this._wrapContract(contractClass);
  }

  public getData(constructorArgs: any, txParams: any): string {
    this._validateNonEmptyBinary();
    this._validateNonUnlinkedLibraries();
    const contractClass = ZWeb3.contract(this.abi);
    return contractClass.deploy({data: this.binary, arguments: constructorArgs}).encodeABI();
  }

  public link(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address: string = libraries[name].replace(/^0x/, '');
      const regex: RegExp = new RegExp(`__${name}_+`, 'g');
      this.binary = this.bytecode.replace(regex, address);
      this.deployedBinary = this.deployedBytecode.replace(regex, address);
    });
  }

  private _wrapContract(contract: any, transactionHash?: string): ContractWrapper {
    const address = contract.options.address;
    const events = contract.events;
    const allEvents = contract.events.allEvents;
    const instance = contract;
    const wrapper: ContractWrapper = { instance, address, transactionHash, allEvents, constructor: this, methods: contract.methods };
    // this._promisifyABI(contract, wrapper);
    this._setSendFunctions(contract, wrapper);
    return wrapper;
  }

  private _setSendFunctions(instance, wrapper) {
    const self = this;

    wrapper.sendTransaction = async function(txParams: any): Promise<TransactionReceiptWrapper> {
      const defaults = await Contracts.getDefaultTxParams();
      const tx = { to: instance.options.address, ...defaults, ...txParams };
      const txHash = await ZWeb3.sendTransactionWithoutReceipt(tx);
      const receiptWithTimeout = await ZWeb3.getTransactionReceiptWithTimeout(txHash, self.timeout);
      return { tx, receipt: receiptWithTimeout };
    };

    wrapper.send = async function(value: any): Promise<string> {
      return wrapper.sendTransaction({ value });
    };
  }

  private async _parseArguments(args: any[]): Promise<[any[], any]> {
    const params = Array.prototype.slice.call(args);
    let givenTxParams = {};
    if (params.length > 0) {
      const lastArg = params[params.length - 1];
      if (typeof(lastArg) === 'object' && !Array.isArray(lastArg) && !BN.isBigNumber(lastArg)) givenTxParams = params.pop();
    }
    const defaults = await Contracts.getDefaultTxParams();
    const txParams = { ...defaults, ...givenTxParams };
    return [params, txParams];
  }

  private _parseEvents(): void {
    this.events = {};
    this.abi
      .filter((item) => item.type === 'event')
      .forEach((event) => {
        const signature = `${event.name}(${event.inputs.map((input) => input.type).join(',')})`;
        const topic = ZWeb3.sha3(signature);
        this.events[topic] = event;
      });
  }

  private _setBinaryIfPossible(): void {
    if (!hasUnlinkedVariables(this.bytecode)) {
      this.binary = this.bytecode;
      this.deployedBinary = this.deployedBytecode;
    }
  }

  private _validateNonEmptyBinary(): void | never {
    if (this.bytecode === '') throw new Error(`A bytecode must be provided for contract ${this.contractName}.`);
  }

  private _validateNonUnlinkedLibraries(): void | never {
    if (hasUnlinkedVariables(this.binary)) {
      const libraries = getSolidityLibNames(this.binary);
      throw new Error(`${this.contractName} bytecode contains unlinked libraries: ${libraries.join(', ')}`);
    }
  }
}
