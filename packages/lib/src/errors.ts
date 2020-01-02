export class ContractNotFound extends Error {
  constructor(contractName) {
    super(`Contract ${contractName} not found`);
  }
}
