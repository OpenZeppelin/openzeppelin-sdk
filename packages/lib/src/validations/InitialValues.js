'use strict'

import _ from 'lodash'
import Contracts from "../utils/Contracts"

export function hasInitialValuesInDeclarations(contractClass) {
  return detectInitialValues(contractClass)
}

function detectInitialValues(contractClass) {
  const nodes = contractClass.ast.nodes.filter((n) => n.name === contractClass.contractName)
  for (let node of nodes) {
    if (hasInitialValues(node)) return true
    for (let baseContract of node.baseContracts || []) {
      const parentContract = Contracts.getFromLocal(baseContract.baseName.name)
      return detectInitialValues(parentContract)
    }
  }
  return false
}

function hasInitialValues(node) {
  const initializedVariables = node.nodes
    .filter(node => !node.constant && node.nodeType === 'VariableDeclaration')
    .filter(node => node.value != null)

  return !_.isEmpty(initializedVariables)
}
