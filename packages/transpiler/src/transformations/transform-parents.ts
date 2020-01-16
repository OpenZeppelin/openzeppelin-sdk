import { getNodeSources } from '../solc/ast-utils';
import { ContractDefinition } from '../solc/ast-node';
import { Transformation } from '../transformation';
import { Artifact } from '../solc/artifact';

export function transformParents(
  contractNode: ContractDefinition,
  source: string,
  contracts: Artifact[],
): Transformation[] {
  const hasInheritance = contractNode.baseContracts.length;

  if (hasInheritance) {
    return contractNode.baseContracts
      .filter(base => contracts.some(contract => base.baseName.name === contract.contractName))
      .map(base => {
        const [start, , baseSource] = getNodeSources(base.baseName, source);
        const [, len] = getNodeSources(base, source);

        return {
          start: start,
          end: start + len,
          text: `${baseSource}Upgradable`,
        };
      });
  } else return [];
}
