import Contract from '../artifacts/Contract';
import { BuildArtifacts } from '..';
import ContractAST, { FunctionDefinitionFilter } from '../utils/ContractAST';

export function hasConstructor(contract: Contract, buildArtifacts: BuildArtifacts): boolean {
  return (
    new ContractAST(contract, buildArtifacts, FunctionDefinitionFilter)
      .getLinearizedBaseContracts()
      .filter(hasNonEmptyConstructorInAST).length > 0
  );
}

function hasNonEmptyConstructorInAST(contractNode: any): boolean {
  return (
    contractNode.nodes
      .filter((n: any) => n.nodeType === 'FunctionDefinition' && n.kind === 'constructor')
      .filter((n: any) => n.body.statements.length > 0 || n.modifiers.length > 0).length > 0
  );
}
