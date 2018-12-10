// TS-TODO: Web3 typings?
export function hasConstructor(contractClass: any): boolean {
  return !!contractClass.abi.find((fn) => fn.type === 'constructor');
}
