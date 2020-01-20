import { getSourceIndices, getContracts } from '../solc/ast-utils';
import { SourceUnit } from '../solc/ast-node';
import { Transformation } from '../transformation';
import { Artifact } from '../solc/artifact';

export function purgeExceptContracts(astNode: SourceUnit, contracts: Artifact[]): Transformation[] {
  const toPurge = getContracts(astNode).filter(node => contracts.every(c => node.name !== c.contractName));
  return toPurge.map(contractNode => {
    const [start, len] = getSourceIndices(contractNode);

    return {
      start,
      end: start + len,
      text: '',
    };
  });
}
