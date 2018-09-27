import flatten from 'truffle-flattener'

export function flattenSourceCode(contract) {
  return flatten(contract)
}
