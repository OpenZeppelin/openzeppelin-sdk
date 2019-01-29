import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { StorageLayoutInfo } from '../validations/Storage';
import { Contract, TransactionObject } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3/types';
import Contracts, { ContractSchema } from './Contracts';
import _ from 'lodash';

export default class ZosContract {

  // Extends Web3's Contract interface.
  public schema: ContractSchema;
  // public binary: string; // TODO: remove
  // public deployedBinary: string; // TODO: remove
  public storageInfo: StorageLayoutInfo;
  public warnings: any;

  constructor(schema: any) {
    this.schema = schema;
    // this._setBinaryIfPossible();
  }

  public async deploy(args: any[] = [], options: any = {}): Promise<Contract> {
    this._validateNonUnlinkedLibraries();
    const defaultOptions = await Contracts.getDefaultTxParams();
    const contract = ZWeb3.contract(this.schema.abi, null, defaultOptions);
    const self = this;
    return new Promise(function(resolve, reject) {
      const tx = contract.deploy({data: self.schema.bytecode, arguments: args});
      const zosData: any = {};
      tx.send({ ...options })
        .on('error', (error) => reject(error))
        .on('receipt', (receipt) => zosData.deploymentTransactionReceipt = receipt)
        .on('transactionHash', (hash) => zosData.deploymentTransactionHash = hash)
        .then((instance) => {
          instance.zosData = zosData;
          resolve(instance);
        })
        .catch((error) => reject(error));
    });
  }

  public at(address: string): Promise<Contract> | never {
    if (!ZWeb3.isAddress(address)) throw new Error('Given address is not valid: ' + address);
    const defaultOptions = Contracts.getArtifactsDefaults();
    const contract = ZWeb3.contract(this.schema.abi, address, defaultOptions);
    return contract;
  }

  public link(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address = libraries[name].replace(/^0x/, '');
      const regex = new RegExp(`__${name}_+`, 'g');
      this.schema.bytecode = this.schema.bytecode.replace(regex, address);
      this.schema.deployedBytecode = this.schema.deployedBytecode.replace(regex, address);
    });
  }

  // private _setBinaryIfPossible(): void {
  //   if(!hasUnlinkedVariables(this.schema.bytecode)) {
  //     this.binary = this.schema.bytecode;
  //     this.deployedBinary = this.schema.deployedBytecode;
  //   }
  // }

  private _validateNonUnlinkedLibraries(): void | never {
    if(hasUnlinkedVariables(this.schema.bytecode)) {
      const libraries = getSolidityLibNames(this.schema.bytecode);
      throw new Error(`${this.schema.contractName} bytecode contains unlinked libraries: ${libraries.join(', ')}`);
    }
  }
}
