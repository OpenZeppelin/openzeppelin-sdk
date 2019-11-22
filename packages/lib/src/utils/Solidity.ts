export function flattenSourceCode(contractPaths: string[], root = process.cwd()): Promise<any> {
  return require('truffle-flattener')(contractPaths, root);
}
