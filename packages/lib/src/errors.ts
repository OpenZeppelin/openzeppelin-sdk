export class ContractNotFound extends Error {
  constructor(contractName: string, dependency?: string) {
    if (dependency === undefined) {
      super(`Contract ${contractName} not found`);
    } else {
      super(`Contract ${contractName} not found in ${dependency}`);
    }
  }
}
