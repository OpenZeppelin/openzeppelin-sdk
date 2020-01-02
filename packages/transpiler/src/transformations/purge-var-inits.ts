import { getVarDeclarations, getNodeSources } from '../solc/ast-utils';
import { ContractDefinition } from '../solc/ast-node';
import { Transformation } from '../transformation';

export function purgeVarInits(contractNode: ContractDefinition, source: string): Transformation[] {
  const varDeclarations = getVarDeclarations(contractNode);
  return varDeclarations
    .filter(vr => vr.value && !vr.constant)
    .map(vr => {
      const [start, , varSource] = getNodeSources(vr, source);
      const match = /(.*)(=.*)/.exec(varSource);
      if (!match) throw new Error(`Can't find = in ${varSource}`);
      return {
        start: start + match[1].length,
        end: start + match[1].length + match[2].length,
        text: '',
      };
    });
}
