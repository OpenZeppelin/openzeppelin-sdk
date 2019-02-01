// TS-TODO: Web3 typings?
export function hasConstructor(contractClass: any): boolean {
  return !!contractClass.schema.abi.find((fn) => fn.type === 'constructor');
}
