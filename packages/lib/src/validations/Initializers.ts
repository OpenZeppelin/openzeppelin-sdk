import invertBy from 'lodash.invertby';
import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract.js';
import { Node } from '../utils/ContractAST';

/**
 * Returns a mapping from a derived contract in the inheritance chain,
 * to an array of base contracts that are uninitialized.
 * @param {*} contract contract class to check (including all its ancestors)
 */
export function getUninitializedBaseContracts(contract: Contract): string[] {
  const uninitializedBaseContracts = {};
  getUninitializedDirectBaseContracts(contract, uninitializedBaseContracts);
  return invertBy(uninitializedBaseContracts);
}

function getUninitializedDirectBaseContracts(contract: Contract, uninitializedBaseContracts: any): void {
  // Check whether the contract has base contracts
  const baseContracts: any = contract.schema.ast.nodes.find((n) => n.name === contract.schema.contractName).baseContracts;
  if (baseContracts.length === 0) return;

  // Run check for the base contracts
  for (const baseContract of baseContracts) {
    const baseContractName: string = baseContract.baseName.name;
    const baseContractClass: Contract = Contracts.getFromLocal(baseContractName);
    getUninitializedDirectBaseContracts(baseContractClass, uninitializedBaseContracts);
  }

  // Make a dict of base contracts that have "initialize" function
  const baseContractsWithInitialize: any[] = [];
  const baseContractInitializers: any = {};
  for (const baseContract of baseContracts) {
    const baseContractName: string = baseContract.baseName.name;
    const baseContractClass: Contract = Contracts.getFromLocal(baseContractName);
    // TS-TODO: define type?
    const baseContractInitializer = getContractInitializer(baseContractClass);
    if (baseContractInitializer !== undefined) {
      baseContractsWithInitialize.push(baseContractName);
      baseContractInitializers[baseContractName] = baseContractInitializer.name;
    }
  }

  // Check that initializer exists
    // TS-TODO: define type?
  const initializer = getContractInitializer(contract);
  if (initializer === undefined) {
    // A contract may lack initializer as long as the base contracts don't have more than 1 initializers in total
    // If there are 2 or more base contracts with initializers, child contract should initialize all of them
    if (baseContractsWithInitialize.length > 1) {
      for (const baseContract of baseContractsWithInitialize) {
        uninitializedBaseContracts[baseContract] = contract.schema.contractName;
      }
    }

    return;
  }

  // Update map with each call of "initialize" function of the base contract
  const initializedContracts: any = {};
  for (const statement of initializer.body.statements) {
    if (statement.nodeType === 'ExpressionStatement' && statement.expression.nodeType === 'FunctionCall') {
      const baseContractName: string = statement.expression.expression.expression.name;
      const functionName: string = statement.expression.expression.memberName;
      if (baseContractInitializers[baseContractName] === functionName) {
        initializedContracts[baseContractName] = true;
      }
    }
  }

  // For each base contract with "initialize" function, check that it's called in the function
  for (const contractName of baseContractsWithInitialize) {
    if (!initializedContracts[contractName]) {
      uninitializedBaseContracts[contractName] = contract.schema.contractName;
  }
    }
  return;
}

function getContractInitializer(contract: Contract): Node | undefined {
  const contractDefinition: Node = contract.schema.ast.nodes
    .find((n: Node) => n.nodeType === 'ContractDefinition' && n.name === contract.schema.contractName);
  const contractFunctions: Node[] = contractDefinition.nodes.filter((n) => n.nodeType === 'FunctionDefinition');
  for (const contractFunction of contractFunctions) {
    const functionModifiers: any = contractFunction.modifiers;
    const initializerModifier: any = functionModifiers.find((m) => m.modifierName.name === 'initializer');
    if (contractFunction.name === 'initialize' || initializerModifier !== undefined) {
      return contractFunction;
    }
  }
  return undefined;
}
