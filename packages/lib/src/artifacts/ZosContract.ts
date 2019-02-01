import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { Contract, TransactionObject, BlockType } from 'web3-eth-contract';
import { Callback, EventLog, EventEmitter, TransactionReceipt } from 'web3/types';
import Contracts from './Contracts';
import { StorageLayoutInfo } from '../validations/Storage';
import _ from 'lodash';

interface SolidityContractSchema {
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

interface ZosContractSchema extends SolidityContractSchema {
  linkedBytecode: string;
  linkedDeployedBytecode: string;
  warnings: any;
  storageInfo: StorageLayoutInfo;
}

interface Web3Contract {
  options: any;
  methods: { [fnName: string]: (...args: any[]) => TransactionObject<any>; };
  deploy(options: { data: string; arguments: any[]; }): TransactionObject<Contract>;
  events: {
    [eventName: string]: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
    allEvents: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
  };
  getPastEvents(event: string, options?: { filter?: object; fromBlock?: BlockType; toBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog[]>): Promise<EventLog[]>;
  setProvider(provider: any): void;
}

export default interface ZosContract extends Web3Contract {
  new: (args: any[], options: any) => Promise<ZosContract>;
  at: (address: string) => ZosContract;
  link: (libraries: { [libAlias: string]: string }) => void;
  schema: ZosContractSchema;
  deployment?: { transactionHash: string, transactionReceipt: TransactionReceipt };
  address: string;
}

export function createZosContract(schema: ZosContractSchema, contractInstance: Contract): ZosContract {
  function wrapContractInstance(instance: Contract) {
    instance.schema = schema;

    instance.new = async function(args: any[] = [], options: any = {}): Promise<ZosContract> {
      if(!schema.linkedBytecode) throw new Error(`${schema.contractName} bytecode contains unlinked libraries.`);
      const mergedOptions = { ...instance.options, from: await Contracts.getDefaultFromAddress(), ...options };
      instance.options = mergedOptions;
      return new Promise(function(resolve, reject) {
        const tx = instance.deploy({data: schema.linkedBytecode, arguments: args});
        let transactionReceipt;
        let transactionHash;
        tx.send(mergedOptions)
          .on('error', (error) => reject(error))
          .on('receipt', (receipt) => transactionReceipt = receipt)
          .on('transactionHash', (hash) => transactionHash = hash)
          .then((deployedInstance) => {
            deployedInstance = wrapContractInstance(deployedInstance);
            deployedInstance.deployment = {
              transactionReceipt,
              transactionHash
            };
            deployedInstance.address = (() => deployedInstance.options.address)();
            resolve(deployedInstance);
          })
          .catch((error) => reject(error));
      });
    };

    instance.at = function(address: string): Contract | never {
      if(!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
      instance.options.address = address;
      instance.address = (() => instance.options.address)();
      return instance;
    };

    instance.link = function(libraries: { [libAlias: string]: string }): void {
      Object.keys(libraries).forEach((name: string) => {
        const address = libraries[name].replace(/^0x/, '');
        const regex = new RegExp(`__${name}_+`, 'g');
        instance.schema.linkedBytecode = instance.schema.bytecode.replace(regex, address);
        instance.schema.linkedDeployedBytecode = instance.schema.deployedBytecode.replace(regex, address);
      });
    };

    return instance;
  }

  return wrapContractInstance(contractInstance);
}
