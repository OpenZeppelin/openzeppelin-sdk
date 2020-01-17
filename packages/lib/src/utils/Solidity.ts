export function flattenSourceCode(contractPaths: string[], root = process.cwd()): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('truffle-flattener')(contractPaths, root);
}
