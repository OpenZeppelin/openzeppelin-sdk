import ZWeb3 from './ZWeb3';
import Contracts from './Contracts';
import { StorageLayoutInfo } from '../validations/Storage';
import { Callback, EventLog, EventEmitter, TransactionReceipt } from 'web3/types';
import { Contract as Web3Contract, TransactionObject, BlockType } from 'web3-eth-contract';

/*
 * ZosContract is an interface that extends Web3's Contract interface, adding some properties and methods like:
 * address getter: retrieves the deployed address
 * schema: compilation artifacts
 * new(): deployes a new contract
 * at(): retrieves a deployed contract at the specified address
 * link(): links libraries in a contract schema
 */
export default interface Contract {

  // Web3 Contract interface.
  options: any;
  methods: { [fnName: string]: (...args: any[]) => TransactionObject<any>; };
  deploy(options: { data: string; arguments: any[]; }): TransactionObject<Web3Contract>;
  events: {
    [eventName: string]: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
    allEvents: (options?: { filter?: object; fromBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog>) => EventEmitter;
  };
  getPastEvents(event: string, options?: { filter?: object; fromBlock?: BlockType; toBlock?: BlockType; topics?: string[]; }, cb?: Callback<EventLog[]>): Promise<EventLog[]>;
  setProvider(provider: any): void;

  // ZosContract specific.
  address: string;
  new: (args: any[], options: any) => Promise<Contract>;
  at: (address: string) => Contract;
  link: (libraries: { [libAlias: string]: string }) => void;
  deployment?: { transactionHash: string, transactionReceipt: TransactionReceipt };
  schema: {

    // Zos schema specific.
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

function _wrapContractInstance(schema: any, instance: Web3Contract): Contract {
  instance.schema = schema;

  instance.new = async function(args: any[] = [], options: any = {}): Promise<Contract> {
    if(!schema.linkedBytecode) throw new Error(`${schema.contractName} bytecode contains unlinked libraries.`);
    instance.options = { ...instance.options, ...(await Contracts.getDefaultTxParams()) };
    return new Promise((resolve, reject) => {
      const tx = instance.deploy({ data: schema.linkedBytecode, arguments: args });
      let transactionReceipt, transactionHash;
      tx.send({ ...options })
        .on('error', (error) => reject(error))
        .on('receipt', (receipt) => transactionReceipt = receipt)
        .on('transactionHash', (hash) => transactionHash = hash)
        .then((deployedInstance) => { // instance != deployedInstance
          deployedInstance = _wrapContractInstance(schema, deployedInstance);
          deployedInstance.deployment = { transactionReceipt, transactionHash };
          resolve(deployedInstance);
        })
        .catch((error) => reject(error));
    });
  };

  instance.at = function(address: string): Contract | never {
    if(!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
    instance.options.address = instance._address = address;
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

  // TODO: Remove after web3 adds the getter: https://github.com/ethereum/web3.js/issues/2274
  if(typeof instance.address === 'undefined') {
    Object.defineProperty(instance, 'address', { get: () => instance.options.address });
  }

  return instance;
}

export function createZosContract(schema: any): Contract {
  const contract = ZWeb3.contract(schema.abi, null, Contracts.getArtifactsDefaults());
  return _wrapContractInstance(schema, contract);
}
