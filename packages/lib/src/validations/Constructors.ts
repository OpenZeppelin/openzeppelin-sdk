import Contract from '../artifacts/Contract';
import { BuildArtifacts } from '..';
import ContractAST, { ContractDefinitionFilter } from '../utils/ContractAST';
import { Artifact } from '../artifacts/BuildArtifacts';

export function hasConstructor(contract: Contract, buildArtifacts: BuildArtifacts): boolean {
  if (hasConstructorInABI(contract.schema)) return true;

  const baseContracts = new ContractAST(contract, buildArtifacts, ContractDefinitionFilter)
    .getLinearizedBaseContracts()
    .map(node => buildArtifacts.getArtifactByName(node.name));

  const baseContractsWithConstructors = baseContracts.filter(hasConstructorInABI);
  return baseContractsWithConstructors.length > 0;
}

function hasConstructorInABI(contract: Artifact): boolean {
  return !!contract.abi.find(fn => fn.type === 'constructor');
}
