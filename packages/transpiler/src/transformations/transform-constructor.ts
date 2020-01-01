import { getVarDeclarations, getNodeSources, getConstructor } from '../solc/ast-utils';

import { buildSuperCallsForChain } from './build-super-calls-for-chain';
import { ContractDefinition } from '../solc/ast-node';
import { Artifact } from '../solc/artifact';

function getVarInits(contractNode: ContractDefinition, source: string) {
  const varDeclarations = getVarDeclarations(contractNode);
  return varDeclarations
    .filter(vr => vr.value && !vr.constant)
    .map(vr => {
      const [, , varSource] = getNodeSources(vr, source);

      const match = /(.*)(=.*)/.exec(varSource);
      if (!match) throw new Error(`Can't find = in ${varSource}`);
      return `\n        ${vr.name} ${match[2]};`;
    })
    .join('');
}

export function transformConstructor(
  contractNode: ContractDefinition,
  source: string,
  contracts: string[],
  contractsToArtifactsMap: Record<string, Artifact>,
) {
  const superCalls = buildSuperCallsForChain(contractNode, source, contracts, contractsToArtifactsMap);

  const declarationInserts = getVarInits(contractNode, source);

  const constructorNode = getConstructor(contractNode);

  const isFullyImplemented = contractNode.fullyImplemented;

  let removeConstructor = null;
  let constructorBodySource = null;
  let constructorParameterList = null;
  let constructorArgsList = null;
  if (constructorNode) {
    constructorBodySource = getNodeSources(constructorNode.body, source)[2]
      .slice(1)
      .slice(0, -1);

    constructorParameterList = getNodeSources(constructorNode.parameters, source)[2]
      .slice(1)
      .slice(0, -1);

    const [start, len] = getNodeSources(constructorNode, source);

    removeConstructor = {
      start: start,
      end: start + len,
      text: '',
    };

    constructorArgsList = constructorNode.parameters.parameters.map(par => par.name).join(',');
  }

  constructorParameterList = constructorParameterList ? constructorParameterList : '';
  const constructorParameterListWithComma = constructorParameterList ? `, ${constructorParameterList}` : '';
  constructorBodySource = constructorBodySource ? constructorBodySource : '';
  constructorArgsList = constructorArgsList ? `, ${constructorArgsList}` : '';

  const initializeFuncText = isFullyImplemented
    ? `
    function initialize(${constructorParameterList}) external initializer {
        __init(true${constructorArgsList});
    }`
    : '';

  const superCallsBlock = superCalls
    ? `if(callChain) {${superCalls}
        }`
    : '';

  const [start, len, contractSource] = getNodeSources(contractNode, source);

  const match = /\bcontract[^\{]*{/.exec(contractSource);
  if (!match) throw new Error(`Can't find contract pattern in ${contractSource}`);

  return [
    removeConstructor,
    {
      start: start + match[0].length,
      end: start + match[0].length,
      text: `${initializeFuncText}\n
    function __init(bool callChain${constructorParameterListWithComma}) internal {
        ${superCallsBlock}
        ${declarationInserts}
        ${constructorBodySource}
    }\n`,
    },
  ].filter(tran => tran !== null);
}
