import Contracts from '../artifacts/Contracts';
import ZosContract from '../artifacts/ZosContract';

export function hasSelfDestruct(contractClass: ZosContract): boolean {
  return hasTypeIdentifier(contractClass, 't_function_selfdestruct_nonpayable$_t_address_$returns$__$');
}

export function hasDelegateCall(contractClass: ZosContract): boolean {
  return hasTypeIdentifier(contractClass, 't_function_baredelegatecall_nonpayable$__$returns$_t_bool_$');
}

function hasTypeIdentifier(contractClass: ZosContract, typeIdentifier: string): boolean {
  for (const node of contractClass.schema.ast.nodes.filter((n) => n.name === contractClass.schema.contractName)) {
    if (hasKeyValue(node, 'typeIdentifier', typeIdentifier)) return true;
    for (const baseContract of node.baseContracts || []) {
      if (hasTypeIdentifier(Contracts.getFromLocal(baseContract.baseName.name), typeIdentifier)) return true;
    }
  }
  return false;
}

function hasKeyValue(data: any, key: string, value: string): boolean {
  if (!data) return false;
  if (data[key] === value) return true;
  for (const childKey in data) {
    if (typeof(data[childKey]) === 'object' && hasKeyValue(data[childKey], key, value)) return true;
  }
  return false;
}
