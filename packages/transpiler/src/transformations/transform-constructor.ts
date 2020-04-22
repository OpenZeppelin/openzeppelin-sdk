import { getNodeSources, getConstructor, stripBraces } from '../solc/ast-utils';
import { getVarInits } from './get-var-inits';
import { Transformation } from '../transformation';
import { buildSuperCallsForChain } from './build-super-calls-for-chain';
import { ContractDefinition } from '../solc/ast-node';
import { Artifact } from '../solc/artifact';

function getVarInitsPart(contractNode: ContractDefinition, source: string): string {
  return getVarInits(contractNode, source)
    .map(([vr, , match]) => `\n        ${vr.name} ${match[2]};`)
    .join('');
}

export function transformConstructor(
  contractNode: ContractDefinition,
  source: string,
  contracts: Artifact[],
  contractsToArtifactsMap: Record<string, Artifact>,
): Transformation[] {
  const superCalls = buildSuperCallsForChain(contractNode, source, contracts, contractsToArtifactsMap);

  const declarationInserts = getVarInitsPart(contractNode, source);

  const constructorNode = getConstructor(contractNode);

  const isFullyImplemented = contractNode.fullyImplemented;

  let removeConstructor = null;
  let constructorBodySource = null;
  let constructorParameterList = null;
  let constructorArgsList = null;
  if (constructorNode) {
    constructorBodySource = stripBraces(getNodeSources(constructorNode.body, source)[2]);

    constructorParameterList = stripBraces(getNodeSources(constructorNode.parameters, source)[2]);

    const [start, len] = getNodeSources(constructorNode, source);

    removeConstructor = {
      start: start,
      end: start + len,
      text: '',
    };

    constructorArgsList = constructorNode.parameters.parameters.map(par => par.name).join(',');
  }

  constructorParameterList = constructorParameterList ?? '';
  const constructorParameterListWithComma = constructorParameterList ? `, ${constructorParameterList}` : '';
  constructorBodySource = constructorBodySource ?? '';
  constructorArgsList = constructorArgsList ? `, ${constructorArgsList}` : '';

  const initializeFuncText = isFullyImplemented
    ? `
    function initialize(${constructorParameterList.replace('string memory', 'string calldata')}) external initializer {
        __init(true${constructorArgsList});
    }`
    : '';

  const superCallsBlock = superCalls
    ? `if(callChain) {${superCalls}
        }`
    : '';

  const [start, , contractSource] = getNodeSources(contractNode, source);

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
  ].filter(tran => tran !== null) as Transformation[];
}
