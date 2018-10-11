import _ from 'lodash';
import Contracts from "../utils/Contracts";

/**
 * Returns a mapping from a derived contract in the inheritance chain,
 * to an array of base contracts that are uninitialized.
 * @param {*} contractClass contract class to check (including all its ancestors)
 */
export function getUninitializedBaseContracts(contractClass) {
  const uninitializedBaseContracts = {}
  getUninitializedDirectBaseContracts(contractClass, uninitializedBaseContracts)
  return _.invertBy(uninitializedBaseContracts)
}

function getUninitializedDirectBaseContracts(contractClass, uninitializedBaseContracts) {
  // Check whether the contract has base contracts
  const baseContracts = contractClass.ast.nodes.find(n => n.name === contractClass.contractName).baseContracts
  if (baseContracts.length == 0) return
  
  // Run check for the base contracts
  for (const baseContract of baseContracts) {
    const baseContractName = baseContract.baseName.name
    const baseContractClass = Contracts.getFromLocal(baseContractName)
    getUninitializedDirectBaseContracts(baseContractClass, uninitializedBaseContracts)
  }

  // Make a dict of base contracts that have "initialize" function
  const baseContractsWithInitialize = []
  const baseContractInitializers = {}
  for (const baseContract of baseContracts) {
    const baseContractName = baseContract.baseName.name
    const baseContractClass = Contracts.getFromLocal(baseContractName)
    const baseContractInitializer = getContractInitializer(baseContractClass)
    if (baseContractInitializer !== undefined) {
      baseContractsWithInitialize.push(baseContractName)
      baseContractInitializers[baseContractName] = baseContractInitializer.name
    }
  }

  // Check that initializer exists
  const initializer = getContractInitializer(contractClass)
  if (initializer === undefined) {
    // A contract may lack initializer as long as the base contracts don't have more than 1 initializers in total
    // If there are 2 or more base contracts with initializers, child contract should initialize all of them
    if (baseContractsWithInitialize.length > 1) {
      for (const baseContract of baseContractsWithInitialize) {
        uninitializedBaseContracts[baseContract] = contractClass.contractName
      }
    }
    return
  }

  // Update map with each call of "initialize" function of the base contract
  const initializedContracts = {}
  for (const statement of initializer.body.statements) {
    if (statement.nodeType === "ExpressionStatement" && statement.expression.nodeType === "FunctionCall") {
      const baseContractName = statement.expression.expression.expression.name
      const functionName = statement.expression.expression.memberName
      if (baseContractInitializers[baseContractName] === functionName) {
        initializedContracts[baseContractName] = true
      }
    }
  }
  
  // For each base contract with "initialize" function, check that it's called in the function
  for (const contractName of baseContractsWithInitialize) {
    if (!initializedContracts[contractName]) {
      uninitializedBaseContracts[contractName] = contractClass.contractName
    }
  }
  return
}

function getContractInitializer(contractClass) {
  const contractDefinition = contractClass.ast.nodes
    .find(n => n.nodeType === "ContractDefinition" && n.name === contractClass.contractName)
  const contractFunctions = contractDefinition.nodes.filter(n => n.nodeType === "FunctionDefinition")
  for (const contractFunction of contractFunctions) {
    const functionModifiers = contractFunction.modifiers
    const initializerModifier = functionModifiers.find(m => m.modifierName.name === "initializer")
    if (contractFunction.name === "initialize" || initializerModifier !== undefined) {
      return contractFunction
    }
  }
  return undefined
}