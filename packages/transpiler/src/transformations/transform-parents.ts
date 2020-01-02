import { getNodeSources } from '../solc/ast-utils';
import { ContractDefinition } from '../solc/ast-node';

export function transformParents(contractNode: ContractDefinition, source: string, contracts: string[]) {
  const hasInheritance = contractNode.baseContracts.length;

  if (hasInheritance) {
    return contractNode.baseContracts
      .filter(base => contracts.some(contract => base.baseName.name === contract))
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
