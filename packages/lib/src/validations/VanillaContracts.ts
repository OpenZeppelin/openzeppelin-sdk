import Contract from '../artifacts/Contract';
import ContractAST from '../utils/ContractAST';

let ETHEREUM_PACKAGE_CONTRACTS = '@openzeppelin/contracts-ethereum-package/';

export function importsEthereumPackageContracts(contract: Contract, buildArtifacts?: any): string[] | undefined {
  const ast = new ContractAST(contract, buildArtifacts, { nodesFilter: [] });
  const illegalImports = [...ast.getImports()]
    .filter(i => i.startsWith(ETHEREUM_PACKAGE_CONTRACTS))
    .map(i => i.slice(ETHEREUM_PACKAGE_CONTRACTS.length))
    .map(i => i.replace(/^contracts\//, ''));

  return illegalImports.length > 0 ? illegalImports : undefined;
}

// Used for testing purposes;
export function setEthereumPackageContractsPackageName(value: string): void {
  ETHEREUM_PACKAGE_CONTRACTS = value;
}
