import _ from 'lodash';
import Contracts from '../artifacts/Contracts';
import ContractFactory from '../artifacts/ContractFactory.js';
import { Node } from '../utils/ContractAST';

export function hasInitialValuesInDeclarations(contractClass: ContractFactory): boolean {
  return detectInitialValues(contractClass);
}

function detectInitialValues(contractClass: ContractFactory): boolean {
  const nodes = contractClass.ast.nodes.filter((n) => n.name === contractClass.contractName);
  for (const node of nodes) {
    if (hasInitialValues(node)) return true;
    for (const baseContract of node.baseContracts || []) {
      const parentContract: ContractFactory = Contracts.getFromLocal(baseContract.baseName.name);
      return detectInitialValues(parentContract);
    }
  }
  return false;
}

function hasInitialValues(node: Node): boolean {
  const initializedVariables = node.nodes
    .filter((nodeItem) => !nodeItem.constant && nodeItem.nodeType === 'VariableDeclaration')
    .filter((nodeItem) => nodeItem.value != null);

  return !_.isEmpty(initializedVariables);
}
