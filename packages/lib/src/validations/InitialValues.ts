import { isEmpty } from 'lodash';
import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract.js';
import { Node } from '../utils/ContractAST';

export function hasInitialValuesInDeclarations(contract: Contract): boolean {
  return detectInitialValues(contract);
}

function detectInitialValues(contract: Contract): boolean {
  const nodes = contract.schema.ast.nodes.filter(n => n.name === contract.schema.contractName);
  for (const node of nodes) {
    if (hasInitialValues(node)) return true;
    for (const baseContract of node.baseContracts || []) {
      const parentContract: Contract = Contracts.getFromLocal(baseContract.baseName.name);
      return detectInitialValues(parentContract);
    }
  }
  return false;
}

function hasInitialValues(node: Node): boolean {
  const initializedVariables = node.nodes
    .filter(nodeItem => !nodeItem.constant && nodeItem.nodeType === 'VariableDeclaration')
    .filter(nodeItem => nodeItem.value != null);

  return !isEmpty(initializedVariables);
}
