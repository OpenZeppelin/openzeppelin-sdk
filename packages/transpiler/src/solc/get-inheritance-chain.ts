import { getContract } from './ast-utils';
import { Artifact } from './artifact';

export function getInheritanceChain(contract: string, contractsToArtifactsMap: Record<string, Artifact>): string[] {
  const art = contractsToArtifactsMap[contract];
  const contractNode = getContract(art.ast, contract);

  if (!contractNode) throw new Error(`Failed to find ${contract} at ${art.fileName}`);

  return contractNode.linearizedBaseContracts.map(base => {
    return contractsToArtifactsMap[base].contractName;
  });
}
