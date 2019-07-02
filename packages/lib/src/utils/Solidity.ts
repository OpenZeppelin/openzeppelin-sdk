import flatten from 'truffle-flattener';

export function flattenSourceCode(contractPaths: string[], root = process.cwd()): Promise<any> {
  return flatten(contractPaths, root);
}
