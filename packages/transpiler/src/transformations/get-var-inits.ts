import { getVarDeclarations, getNodeSources } from '../solc/ast-utils';
import { ContractDefinition, VariableDeclaration } from '../solc/ast-node';

export function getVarInits(
  contractNode: ContractDefinition,
  source: string,
): [VariableDeclaration, number, RegExpExecArray][] {
  const varDeclarations = getVarDeclarations(contractNode);
  return varDeclarations
    .filter(vr => vr.value && !vr.constant)
    .map(vr => {
      const [start, , varSource] = getNodeSources(vr, source);
      const match = /(.*)(=.*)/.exec(varSource);
      if (!match) throw new Error(`Can't find = in ${varSource}`);
      return [vr, start, match];
    });
}
