import flatten from 'truffle-flattener';

// TS-TODO: contract might be typed with some sort of web3 typed lib.
export function flattenSourceCode(
  contractPaths: string[],
  root = process.cwd(),
): Promise<any> {
  return flatten(contractPaths, root);
}
