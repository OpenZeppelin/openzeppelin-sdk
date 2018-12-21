import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import decodeLogs from '../helpers/decodeLogs';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { StorageLayoutInfo } from '../validations/Storage';

interface ContractSchema {
  contractName: string;
  abi: any;
  ast: any;
  bytecode: string;
  deployedBytecode: string;
}

export interface ContractWrapper {
  address: string;
  transactionHash: string;
  allEvents: any;
  sendTransaction?: (txParams: any) => Promise<TransactionReceiptWrapper>;
  send?: (value: any) => Promise<string>;
  constructor: any;
}

export interface TransactionReceiptWrapper {
  logs: any[];
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

  constructor(schema: ContractSchema, timeout, txParams) {
    this.abi = schema.abi;
    this.ast = schema.ast;
    this.bytecode = schema.bytecode;
    this.deployedBytecode = schema.deployedBytecode;
    this.contractName = schema.contractName;
    this.timeout = timeout;
    this.txParams = txParams;
    this._parseEvents();
    this._setBinaryIfPossible();
  }

  public async new(...passedArguments): Promise<ContractWrapper> {
    this._validateNonEmptyBinary();
    this._validateNonUnlinkedLibraries();

    const [args, txParams] = this._parseArguments(passedArguments);
    if (!txParams.data) txParams.data = this.binary;
    const self = this;

    return new Promise(function(resolve, reject) {
      const contractClass: any = ZWeb3.contract(self.abi);
      contractClass.new(...args, txParams, function(error, instance) {
        if (error) reject(error);
        else if (instance && instance.address) {
          const wrapper: ContractWrapper = self._wrapContract(instance);
          resolve(wrapper);
        }
      });
    });
  }

  public at(address: string): ContractWrapper | never {
    if (!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
    const contractClass: any = ZWeb3.contract(this.abi);
    const contract: any = contractClass.at(address);

    return this._wrapContract(contract);
  }

  public getData(constructorArgs: any, txParams: any): string {
    this._validateNonEmptyBinary();
    this._validateNonUnlinkedLibraries();
    const contractClass = ZWeb3.contract(this.abi);
    return contractClass.new.getData(...constructorArgs, { ...txParams, data: this.binary });
  }

  public link(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address: string = libraries[name].replace(/^0x/, '');
      const regex: RegExp = new RegExp(`__${name}_+`, 'g');
      this.binary = this.bytecode.replace(regex, address);
      this.deployedBinary = this.deployedBytecode.replace(regex, address);
    });
  }

  private _wrapContract(contract): ContractWrapper {
    const { address, transactionHash, allEvents } = contract;
    const wrapper: ContractWrapper = { address, transactionHash, allEvents, constructor: this };
    this._promisifyABI(contract, wrapper);
    this._setSendFunctions(contract, wrapper);
    return wrapper;
  }

  private _setSendFunctions(instance, wrapper) {
    const self = this;

    wrapper.sendTransaction = async function(txParams: any): Promise<TransactionReceiptWrapper> {
      const tx = await ZWeb3.sendTransaction({ to: instance.address, ...self.txParams, ...txParams });
      const receipt = await ZWeb3.getTransactionReceiptWithTimeout(tx, self.timeout);
      return { tx, receipt, logs: decodeLogs(receipt.logs, self) };
    };

    wrapper.send = async function(value: any): Promise<string> {
      return wrapper.sendTransaction({ value });
    };
  }

  private _promisifyABI(instance: any, wrapper: ContractWrapper): void {
    instance.abi.filter((item: any) => item.type === 'event').forEach((item: any) => wrapper[item.name] = instance[item.name]);
    instance.abi.filter((item: any) => item.type === 'function').forEach((item: any) => {
      wrapper[item.name] = item.constant
        ? this._promisifyFunction(instance[item.name], instance)
        : this._promisifyFunctionWithTimeout(instance[item.name], instance);
      wrapper[item.name].request = instance[item.name].request;
      wrapper[item.name].call = this._promisifyFunction(instance[item.name].call, instance);
      wrapper[item.name].sendTransaction = this._promisifyFunction(instance[item.name].sendTransaction, instance);
      wrapper[item.name].estimateGas = this._promisifyFunction(instance[item.name].estimateGas, instance);
    });
  }

  private _promisifyFunction(fn: (...passedArguments) => void, instance: any): (passedArguments: any[]) => Promise<any> {
    const self = this;
    return async function(...passedArguments): Promise<any> {
      const [args, txParams] = self._parseArguments(passedArguments);
      return new Promise(function(resolve, reject) {
        args.push(txParams, function(error, result) {
          return error ? reject(error) : resolve(result);
        });
        fn.apply(instance, args);
      });
    };
  }

  private _promisifyFunctionWithTimeout(fn: (...passedArguments) => void, instance: any): (passedArguments: any[]) => Promise<any> {
    const self = this;
    return async function(...passedArguments): Promise<any> {
      const [args, txParams] = self._parseArguments(passedArguments);
      return new Promise(function(resolve, reject) {
        args.push(txParams, function(error, tx) {
          return error ? reject(error) : ZWeb3.getTransactionReceiptWithTimeout(tx, self.timeout)
            .then((receipt) => resolve({ tx, receipt, logs: decodeLogs(receipt.logs, self) }))
            .catch(reject);
        });
        fn.apply(instance, args);
      });
    };
  }

  private _parseArguments(args: any[]): [any[], any] {
    const params = Array.prototype.slice.call(args);
    let givenTxParams = {};
    if (params.length > 0) {
      const lastArg = params[params.length - 1];
      if (typeof(lastArg) === 'object' && !Array.isArray(lastArg) && !BN.isBigNumber(lastArg)) givenTxParams = params.pop();
    }
    const txParams = { ...this.txParams, ...givenTxParams };
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
