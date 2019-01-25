import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { StorageLayoutInfo } from '../validations/Storage';
import { Contract, TransactionObject } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3/types';
import Contracts from './Contracts';
import _ from 'lodash';

interface ContractSchema {
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
}

export default class ZosContract {

  // Wrap Web3 Contract's interface.
  private _contract: Contract;
  public get options(): any {
    return this._contract.options;
  }
  public get methods(): any {
    return this._contract.methods;
  }
  public get _address(): string {
    return this._contract._address;
  }
  public async getPastEvents(event: string, options?: any, cb?: any): Promise<any> {
    return this._contract.getPastEvents(event, options, (error, res) => {
      if(cb) cb(error, res);
    });
  }

  // Extends Web3's Contract interface.
  public schema: ContractSchema;
  public binary: string;
  public deployedBinary: string;
  public events: any;
  public storageInfo: StorageLayoutInfo;
  public warnings: any;
  public deploymentTransactionReceipt: TransactionReceipt;
  public deploymentTransactionHash: string;

  constructor(schema: any, atAddress?: any, options?: any) {

    // Extract info from schema.
    this.schema = schema;
    this._parseEvents();
    this._setBinaryIfPossible();

    // Initialize Web3 contract.
    this._contract = ZWeb3.contract(schema.abi, atAddress, options);
  }

  public async deploy(args: any[] = [], options: any = {}): Promise<ZosContract> {
    this._validateNonEmptyBinary();
    this._validateNonUnlinkedLibraries();

    const defaultOptions = await Contracts.getDefaultTxParams();
    this._contract.options = { ...this._contract.options, ...defaultOptions };

    const self = this;
    return new Promise(function(resolve, reject) {
      const tx = self._contract.deploy({data: self.binary, arguments: args});
      tx.send({ ...options })
        .on('error', (error) => reject(error))
        .on('receipt', (receipt) => self.deploymentTransactionReceipt = receipt)
        .on('transactionHash', (hash) => self.deploymentTransactionHash = hash)
        .then((instance) => {
          self.at(instance._address);
          resolve(self);
        })
        .catch((error) => reject(error));
    });
  }

  public at(address: string): ZosContract | never {
    if (!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
    this._contract.options.address = address;
    this._contract._address = address;
    return this;
  }

  public link(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address = libraries[name].replace(/^0x/, '');
      const regex = new RegExp(`__${name}_+`, 'g');
      this.binary = this.schema.bytecode.replace(regex, address);
      this.deployedBinary = this.schema.deployedBytecode.replace(regex, address);
    });
  }

  private _parseEvents(): void {
    this.events = {};
    this.schema.abi
      .filter((item) => item.type === 'event')
      .forEach((event) => {
        const signature = `${event.name}(${event.inputs.map((input) => input.type).join(',')})`;
        const topic = ZWeb3.sha3(signature);
        this.events[topic] = event;
      });
  }

  private _setBinaryIfPossible(): void {
    if (!hasUnlinkedVariables(this.schema.bytecode)) {
      this.binary = this.schema.bytecode;
      this.deployedBinary = this.schema.deployedBytecode;
    }
  }

  private _validateNonEmptyBinary(): void | never {
    if (this.schema.bytecode === '') throw new Error(`A bytecode must be provided for contract ${this.schema.contractName}.`);
  }

  private _validateNonUnlinkedLibraries(): void | never {
    if (hasUnlinkedVariables(this.binary)) {
      const libraries = getSolidityLibNames(this.binary);
      throw new Error(`${this.schema.contractName} bytecode contains unlinked libraries: ${libraries.join(', ')}`);
    }
  }
}
