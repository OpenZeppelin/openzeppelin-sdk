import { getContract } from './ast-utils';
import { Artifact } from './artifact';

export function getInheritanceChain(contract: string, contractsToArtifactsMap: Record<string, Artifact>): string[] {
  const art = contractsToArtifactsMap[contract];
  const contractNode = getContract(art.ast, contract);

  return contractNode.linearizedBaseContracts.map(base => {
    return contractsToArtifactsMap[base].contractName;
  });
}
