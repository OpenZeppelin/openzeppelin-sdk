import { getContract } from './ast-utils';
import { Artifact } from './artifact';

export function getInheritanceChain(contract: string, contractsToArtifactsMap: Record<string, Artifact>): Artifact[] {
  const art = contractsToArtifactsMap[contract];
  const contractNode = getContract(art);

  return contractNode.linearizedBaseContracts.map(base => contractsToArtifactsMap[base]);
}
