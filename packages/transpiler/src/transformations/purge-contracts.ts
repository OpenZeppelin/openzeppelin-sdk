import { getSourceIndices, getContracts } from '../solc/ast-utils';
import { SourceUnit } from '../solc/ast-node';

export function purgeContracts(astNode: SourceUnit, contracts: string[]) {
  const toPurge = getContracts(astNode).filter(node => contracts.every(c => node.name !== c));
  return toPurge.map(contractNode => {
    const [start, len] = getSourceIndices(contractNode);

    return {
      start,
      end: start + len,
      text: '',
    };
  });
}
