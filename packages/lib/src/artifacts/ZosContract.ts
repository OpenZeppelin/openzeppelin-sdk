import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { Contract, TransactionObject } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3/types';
import { StorageLayoutInfo } from '../validations/Storage';
import Contracts from './Contracts';
import _ from 'lodash';

export default class ZosContract {

  // Solidity contract schema properties.
  public schemaVersion: string;
  public contractName: string;
  public abi: any[];
  public bytecode: string;
  public deployedBytecode: string;
  public sourceMap: string;
  public deployedSourceMap: string;
  public source: string;
  public sourcePath: string;
  public ast: any;
  public legacyAST: any;
  public compiler: any;
  public networks: any;
  public updatedAt: string;

  // Custom schema properties.
  public linkedBytecode: string;
  public linkedDeployedBytecode: string;
  public warnings: any;
  public storageInfo: StorageLayoutInfo;

  constructor(schema: any) {
    Object.assign(this, schema);
  }

  public async deploy(args: any[] = [], options: any = {}): Promise<Contract> {
    if(!this.linkedBytecode) throw new Error(`${this.contractName} bytecode contains unlinked libraries.`);
    const contract = ZWeb3.contract(this.abi, null, await Contracts.getDefaultTxParams());
    const self = this;
    return new Promise(function(resolve, reject) {
      const tx = contract.deploy({data: self.linkedBytecode, arguments: args});
      const injectedData: any = { deployment: {} };
      tx.send({ ...options })
        .on('error', (error) => reject(error))
        .on('receipt', (receipt) => injectedData.deployment.transactionReceipt = receipt)
        .on('transactionHash', (hash) => injectedData.deployment.transactionHash = hash)
        .then((instance) => {
          instance = Object.assign(instance, injectedData);
          instance.address = instance.options.address;
          resolve(instance);
        })
        .catch((error) => reject(error));
    });
  }

  public at(address: string): Contract | never {
    const defaultOptions = Contracts.getArtifactsDefaults();
    const instance = ZWeb3.contract(this.abi, address, defaultOptions);
    instance.address = instance.options.address;
    return instance;
  }

  public link(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address = libraries[name].replace(/^0x/, '');
      const regex = new RegExp(`__${name}_+`, 'g');
      this.linkedBytecode = this.bytecode.replace(regex, address);
      this.linkedDeployedBytecode = this.deployedBytecode.replace(regex, address);
    });
  }
}
