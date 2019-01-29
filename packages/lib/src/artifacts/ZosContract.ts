import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { Contract, TransactionObject } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3/types';
import Contracts, { ZosContractSchema } from './Contracts';
import _ from 'lodash';

export default class ZosContract {
  public schema: ZosContractSchema;

  constructor(schema: any) {
    this.schema = schema;
  }

  public async deploy(args: any[] = [], options: any = {}): Promise<Contract> {
    if(!this.schema.linkedBytecode) throw new Error(`${this.schema.contractName} bytecode contains unlinked libraries.`);
    const contract = ZWeb3.contract(this.schema.abi, null, await Contracts.getDefaultTxParams());
    const self = this;
    return new Promise(function(resolve, reject) {
      const tx = contract.deploy({data: self.schema.linkedBytecode, arguments: args});
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
      this.schema.linkedBytecode = this.schema.bytecode.replace(regex, address);
      this.schema.linkedDeployedBytecode = this.schema.deployedBytecode.replace(regex, address);
    });
  }
}
