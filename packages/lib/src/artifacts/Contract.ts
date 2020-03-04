import { isAddress } from 'web3-utils';

import ZWeb3 from './ZWeb3';
import Contracts from './Contracts';
import ContractAST, { ContractDefinitionFilter } from '../utils/ContractAST';
import { StorageLayoutInfo } from '../validations/Storage';
import { TransactionReceipt } from 'web3-core';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { getArgTypeLabel } from '../utils/ABIs';
import { Artifact } from './BuildArtifacts';

/*
 * Contract is an interface that extends Web3's Contract interface, adding some properties and methods like:
 * address getter: retrieves the deployed address
 * schema: compilation artifacts
 * new(): deployes a new contract
 * at(): retrieves a deployed contract at the specified address
 * link(): links libraries in a contract schema
 */
export default interface Contract extends Web3Contract {
  // Contract specific.
  address: string;
  new: (args?: any[], options?: {}) => Promise<Contract>;
  at: (address: string) => Contract;
  link: (libraries: { [libAlias: string]: string }) => void;
  deployment?: {
    transactionHash: string;
    transactionReceipt: TransactionReceipt;
  };
  schema: {
    directory: string;
    linkedBytecode: string;
    linkedDeployedBytecode: string;
    storageInfo: StorageLayoutInfo;
    warnings: any;
  } & Artifact;
  upgradeable?: Contract;
}

export enum ContractMethodMutability {
  Constant,
  NotConstant,
}

interface ContractMethod {
  name: string;
  hasInitializer: boolean;
  inputs: string[];
}

function _wrapContractInstance(schema: any, web3instance: Web3Contract): Contract {
  const instance: Contract = web3instance as Contract;
  instance.schema = schema;

  instance.new = async function(...passedArguments): Promise<Contract> {
    const [args, options] = parseArguments(passedArguments, schema.abi);
    if (!schema.linkedBytecode) throw new Error(`${schema.contractName} bytecode contains unlinked libraries.`);
    instance.options = {
      ...instance.options,
      ...(await Contracts.getDefaultTxParams()),
    };
    return new Promise((resolve, reject) => {
      const tx = instance.deploy({
        data: schema.linkedBytecode,
        arguments: args,
      });
      let transactionReceipt, transactionHash;
      tx.send({ ...options })
        .on('error', error => reject(error))
        .on('receipt', receipt => (transactionReceipt = receipt))
        .on('transactionHash', hash => (transactionHash = hash))
        .then(web3DeployedInstance => {
          // instance != deployedInstance
          const deployedInstance = _wrapContractInstance(schema, web3DeployedInstance);
          deployedInstance.deployment = { transactionReceipt, transactionHash };
          resolve(deployedInstance);
        })
        .catch(error => reject(error));
    });
  };

  instance.at = function(address: string): Contract | never {
    if (!isAddress(address)) throw new Error('Given address is not valid: ' + address);
    const newWeb3Instance = instance.clone();
    newWeb3Instance['_address'] = address;
    newWeb3Instance.options.address = address;
    return _wrapContractInstance(instance.schema, newWeb3Instance);
  };

  instance.link = function(libraries: { [libAlias: string]: string }): void {
    instance.schema.linkedBytecode = instance.schema.bytecode;
    instance.schema.linkedDeployedBytecode = instance.schema.deployedBytecode;

    Object.keys(libraries).forEach((name: string) => {
      const address = libraries[name].replace(/^0x/, '');
      const regex = new RegExp(`__${name}_+`, 'g');
      instance.schema.linkedBytecode = instance.schema.linkedBytecode.replace(regex, address);
      instance.schema.linkedDeployedBytecode = instance.schema.linkedDeployedBytecode.replace(regex, address);
    });
  };

  // TODO: Remove after web3 adds the getter: https://github.com/ethereum/web3.js/issues/2274
  if (typeof instance.address === 'undefined') {
    Object.defineProperty(instance, 'address', {
      get: () => instance.options.address,
    });
  }

  return instance;
}

export function createContract(schema: any): Contract {
  const contract = new ZWeb3.eth.Contract(schema.abi, null, Contracts.getArtifactsDefaults());
  return _wrapContractInstance(schema, contract);
}

export function contractMethodsFromAbi(
  instance: Contract,
  constant: ContractMethodMutability = ContractMethodMutability.NotConstant,
): any[] {
  const isConstant = constant === ContractMethodMutability.Constant;
  const mutabilities = abiStateMutabilitiesFor(constant);
  const methodsFromAst = getAstMethods(instance);

  return instance.schema.abi
    .filter(
      ({ stateMutability, constant: isConstantMethod, type }) =>
        type === 'function' && (isConstant === isConstantMethod || mutabilities.includes(stateMutability)),
    )
    .map(method => {
      const { name, inputs } = method;
      const selector = `${name}(${inputs.map(getArgTypeLabel).join(',')})`;
      const infoFromAst = methodsFromAst.find(({ selector: selectorFromAst }) => selectorFromAst === selector);
      const modifiers = infoFromAst ? infoFromAst.modifiers : [];
      const initializer = modifiers.find(({ modifierName }) => modifierName.name === 'initializer');
      return {
        selector,
        hasInitializer: initializer ? true : false,
        ...method,
      };
    });
}

// get methods from AST, as there is no info about the modifiers in the ABI
export function contractMethodsFromAst(
  instance: Contract,
  constant: ContractMethodMutability = ContractMethodMutability.NotConstant,
): ContractMethod[] {
  const mutabilities = abiStateMutabilitiesFor(constant);
  const visibilities = ['public', 'external'];

  return getAstMethods(instance)
    .filter(
      ({ visibility, stateMutability }) => visibilities.includes(visibility) && mutabilities.includes(stateMutability),
    )
    .map(method => {
      const initializer = method.modifiers.find(({ modifierName }) => modifierName.name === 'initializer');
      return { ...method, hasInitializer: initializer ? true : false };
    });
}

interface MethodArg {
  type: string;
  internalType?: string;
  components?: MethodArg[];
  name: string;
}

export function getConstructorInputs(contract: Contract): MethodArg[] {
  return contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];
}

function getAstMethods(instance: Contract): any[] {
  return new ContractAST(instance, null, ContractDefinitionFilter).getMethods();
}

function abiStateMutabilitiesFor(constant: ContractMethodMutability) {
  return constant === ContractMethodMutability.Constant ? ['view', 'pure'] : ['payable', 'nonpayable'];
}

function parseArguments(passedArguments, abi) {
  const constructorAbi = abi.find(elem => elem.type === 'constructor') || {};
  const constructorArgs = constructorAbi.inputs && constructorAbi.inputs.length > 0 ? constructorAbi.inputs : [];
  let givenOptions = {};

  if (passedArguments.length === constructorArgs.length + 1) {
    const lastArg = passedArguments[passedArguments.length - 1];
    if (typeof lastArg === 'object') {
      givenOptions = passedArguments.pop();
    }
  }
  return [passedArguments, givenOptions];
}
