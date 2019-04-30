import ZWeb3 from './ZWeb3';
import Contracts from './Contracts';
import ContractAST from '../utils/ContractAST';
import { StorageLayoutInfo } from '../validations/Storage';
import { Contract as Web3Contract, TransactionObject, BlockType } from 'web3-eth-contract';

/*
 * Contract is an interface that extends Web3's Contract interface, adding some properties and methods like:
 * address getter: retrieves the deployed address
 * schema: compilation artifacts
 * new(): deployes a new contract
 * at(): retrieves a deployed contract at the specified address
 * link(): links libraries in a contract schema
 */
export default interface Contract {

  deploy(options: { data: string; arguments: any[]; }): any;
  methods: { [fnName: string]: (...args: any[]) => any; };

  // Contract specific.
  address: string;
  new: (args?: any[], options?: {}) => Promise<Contract>;
  at: (address: string) => Contract;
  link: (libraries: { [libAlias: string]: string }) => void;
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

interface ContractMethod {
  name: string;
  hasInitializer: boolean;
  inputs: string[];
}

export function createContract(schema: any): Contract {
  const contract = ZWeb3.contract(schema.abi, null, Contracts.getArtifactsDefaults());
  return ZWeb3.wrapContractInstance(schema, contract);
}

// get methods from AST, as there is no info about the modifiers in the ABI
export function contractMethodsFromAst(instance: Contract): ContractMethod[] {
  const contractAst = new ContractAST(instance, null, { nodesFilter: ['ContractDefinition'] });
  return contractAst.getMethods()
    .filter(({ visibility }) => visibility === 'public' || visibility === 'external')
    .map(method => {
      const initializer = method
        .modifiers
        .find(({ modifierName }) => modifierName.name === 'initializer');

      return { ...method, hasInitializer: initializer ? true : false };
    });
}