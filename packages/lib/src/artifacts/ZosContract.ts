import BN from 'bignumber.js';
import ZWeb3 from './ZWeb3';
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode';
import { Contract, TransactionObject } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3/types';
import Contracts, { ZosContractSchema } from './Contracts';
import _ from 'lodash';

interface ZosContract {
  [id: string]: any; // TODO: define.
}

export default function createZosContract(schema: ZosContractSchema, instance: Contract): ZosContract {

  // Add an `.address` getter to the instance.
  // TODO: Should be removed when Web3 restores the `.address` getter.
  function addAddressGetter(anInstance: Contract): void {
    Object.defineProperty(anInstance, 'address', { get: () => anInstance.options.address });
  }

  instance.new = async function(args: any[] = [], options: any = {}): Promise<Contract> {
    if(!this.schema.linkedBytecode) throw new Error(`${this.schema.contractName} bytecode contains unlinked libraries.`);
    const contract = ZWeb3.contract(this.schema.abi, null, await Contracts.getDefaultTxParams());
    const self = this;
    return new Promise(function(resolve, reject) {
      const tx = contract.deploy({data: self.schema.linkedBytecode, arguments: args});
      const injectedData: any = {
        schema: self.schema,
        deployment: {} // Gets filled in below async...
      };
      tx.send({ ...options })
        .on('error', (error) => reject(error))
        .on('receipt', (receipt) => injectedData.deployment.transactionReceipt = receipt)
        .on('transactionHash', (hash) => injectedData.deployment.transactionHash = hash)
        .then((deployedInstance) => {
          Object.assign(deployedInstance, injectedData);
          addAddressGetter(deployedInstance);
          resolve(deployedInstance);
        })
        .catch((error) => reject(error));
    });
  };

  instance.at = function(address: string): Contract | never {
    const defaultOptions = Contracts.getArtifactsDefaults();
    const retrievedInstance = ZWeb3.contract(this.schema.abi, address, defaultOptions);
    addAddressGetter(retrievedInstance);
    return retrievedInstance;
  };

  instance.link = function(libraries: { [libAlias: string]: string }): void {
    Object.keys(libraries).forEach((name: string) => {
      const address = libraries[name].replace(/^0x/, '');
      const regex = new RegExp(`__${name}_+`, 'g');
      this.schema.linkedBytecode = this.schema.bytecode.replace(regex, address);
      this.schema.linkedDeployedBytecode = this.schema.deployedBytecode.replace(regex, address);
    });
  };

  return instance;
}
