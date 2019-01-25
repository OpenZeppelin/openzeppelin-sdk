import isEmpty from 'lodash.isempty';
import Contracts from '../artifacts/Contracts';
import ZosContract from '../artifacts/ZosContract.js';
import { Node } from '../utils/ContractAST';

export function hasInitialValuesInDeclarations(contractClass: ZosContract): boolean {
  return detectInitialValues(contractClass);
}

function detectInitialValues(contractClass: ZosContract): boolean {
  const nodes = contractClass.schema.ast.nodes.filter((n) => n.name === contractClass.schema.contractName);
  for (const node of nodes) {
    if (hasInitialValues(node)) return true;
    for (const baseContract of node.baseContracts || []) {
      const parentContract: ZosContract = Contracts.getFromLocal(baseContract.baseName.name);
      return detectInitialValues(parentContract);
    }
  }
  return false;
}

function hasInitialValues(node: Node): boolean {
  const initializedVariables = node.nodes
    .filter((nodeItem) => !nodeItem.constant && nodeItem.nodeType === 'VariableDeclaration')
    .filter((nodeItem) => nodeItem.value != null);

  return !isEmpty(initializedVariables);
}
