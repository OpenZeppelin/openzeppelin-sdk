export function hasConstructor(contractClass) {
  return !!contractClass.abi.find(fn => fn.type === "constructor");
}