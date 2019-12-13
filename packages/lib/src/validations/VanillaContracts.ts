import Contract from '../artifacts/Contract';
import ContractAST from '../utils/ContractAST';

let VANILLA_CONTRACTS = '@openzeppelin/contracts/';

export function importsVanillaContracts(contract: Contract, buildArtifacts?: any): string[] | null {
  const ast = new ContractAST(contract, buildArtifacts, { nodesFilter: ['ContractDefinition'] });
  const illegalImports = [...ast.getImports()]
    .filter(i => i.startsWith(VANILLA_CONTRACTS))
    .map(i => i.slice(VANILLA_CONTRACTS.length))
    .map(i => i.replace(/^contracts\//, ''));

  return illegalImports.length > 0 ? illegalImports : null;
}

// Used for testing purposes;
export function setVanillaContractsPackageName(value: string) {
  VANILLA_CONTRACTS = value;
}
