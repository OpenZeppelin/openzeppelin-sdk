import { getVarInits } from './get-var-inits';
import { ContractDefinition } from '../solc/ast-node';
import { Transformation } from '../transformation';

export function purgeVarInits(contractNode: ContractDefinition, source: string): Transformation[] {
  return getVarInits(contractNode, source).map(([, start, match]) => ({
    start: start + match[1].length,
    end: start + match[1].length + match[2].length,
    text: '',
  }));
}
