import Contracts from '../artifacts/Contracts';
import Contract from '../artifacts/Contract';

export function hasSelfDestruct(contract: Contract): boolean {
  return hasTypeIdentifier(contract, [
    't_function_selfdestruct_nonpayable$_t_address_$returns$__$',
    't_function_selfdestruct_nonpayable$_t_address_payable_$returns$__$',
    't_function_selfdestruct_nonpayable$_t_address_nonpayable_$returns$__$',
  ]);
}

export function hasDelegateCall(contract: Contract): boolean {
  return hasTypeIdentifier(contract, [
    't_function_baredelegatecall_nonpayable$__$returns$_t_bool_$',
    't_function_baredelegatecall_nonpayable$_t_bytes_memory_ptr_$returns$_t_bool_$_t_bytes_memory_ptr_$',
  ]);
}

function hasTypeIdentifier(contract: Contract, typeIdentifiers: string[]): boolean {
  for (const node of contract.schema.ast.nodes.filter(n => n.name === contract.schema.contractName)) {
    if (hasKeyValue(node, 'typeIdentifier', typeIdentifiers)) return true;
    for (const baseContract of node.baseContracts || []) {
      if (hasTypeIdentifier(Contracts.getFromLocal(baseContract.baseName.name), typeIdentifiers)) return true;
    }
  }
  return false;
}

function hasKeyValue(data: any, key: string, values: string[]): boolean {
  if (!data) return false;
  if (values.includes(data[key])) return true;
  for (const childKey in data) {
    if (typeof data[childKey] === 'object' && hasKeyValue(data[childKey], key, values)) return true;
  }
  return false;
}
