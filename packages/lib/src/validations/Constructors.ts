// TS-TODO: Web3 typings?
export function hasConstructor(contract: any): boolean {
  return !!contract.schema.abi.find(fn => fn.type === 'constructor');
}
