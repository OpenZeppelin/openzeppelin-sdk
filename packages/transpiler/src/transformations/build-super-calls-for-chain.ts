import { getNodeSources, getConstructor, getContract, idModifierInvocation } from '../solc/ast-utils';

import { getInheritanceChain } from '../solc/get-inheritance-chain';
import { ContractDefinition, ModifierInvocation, Literal } from '../solc/ast-node';
import { Artifact } from '../solc/artifact';

// builds an __init call with given arguments, for example
// ERC20DetailedUpgradable.__init(false, "Gold", "GLD", 18)
function buildSuperCall(args: Literal[], name: string, source: string): string {
  let superCall = `\n            ${name}Upgradable.__init(false`;
  if (args && args.length) {
    superCall += args.reduce((acc, arg) => {
      const [, , argSource] = getNodeSources(arg, source);
      return acc + `, ${argSource}`;
    }, '');
  }
  return superCall + ');';
}

// builds all the __init calls for the parent of a given contract, for example
// [ '\n            ContextUpgradable.__init(false);' ]
function buildSuperCalls(
  node: ContractDefinition,
  source: string,
  contracts: string[],
  mods: ModifierInvocation[],
  contractsToArtifactsMap: Record<string, Artifact>,
): (string | never[])[] {
  const hasInheritance = node.baseContracts.length;
  if (hasInheritance) {
    return [
      ...node.baseContracts
        .filter(base => contracts.some(contract => base.baseName.name === contract))
        .map(base => {
          const mod = mods.filter(mod => mod.modifierName.name === base.baseName.name)[0];
          if (mod) {
            return buildSuperCall(mod.arguments, mod.modifierName.name, source);
          } else {
            const contractName = base.baseName.name;
            const art = contractsToArtifactsMap[contractName];
            const node = getContract(art.ast, contractName);
            const constructorNode = getConstructor(node);

            return (constructorNode && !constructorNode.parameters.parameters.length) ||
              (base.arguments && base.arguments.length)
              ? buildSuperCall(base.arguments, contractName, source)
              : [];
          }
        }),
    ];
  } else {
    return [];
  }
}

// builds all the __init calls a given contract, for example
// ContextUpgradable.__init(false);
// ERC20DetailedUpgradable.__init(false, 'Gold', 'GLD', 18);
export function buildSuperCallsForChain(
  contractNode: ContractDefinition,
  source: string,
  contracts: string[],
  contractsToArtifactsMap: Record<string, Artifact>,
): string {
  const chain = getInheritanceChain(contractNode.name, contractsToArtifactsMap);
  const mods = chain
    .map(base => {
      const art = contractsToArtifactsMap[base];
      const node = getContract(art.ast, base);

      const constructorNode = getConstructor(node);
      return constructorNode ? constructorNode.modifiers.filter(mod => idModifierInvocation(mod)) : [];
    })
    .flat();

  return [
    ...new Set(
      chain
        .map(base => {
          return buildSuperCalls(
            getContract(contractsToArtifactsMap[base].ast, base),
            source,
            contracts,
            mods,
            contractsToArtifactsMap,
          ).reverse();
        })
        .flat(),
    ),
  ]
    .reverse()
    .join('');
}
