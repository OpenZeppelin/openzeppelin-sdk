import { flatten } from 'lodash';

import { getNodeSources, getConstructor, getContract, isModifierInvocation } from '../solc/ast-utils';

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
  contractsToTranspile: Artifact[],
  mods: ModifierInvocation[],
): (string | never[])[] {
  const hasInheritance = node.baseContracts.length;
  if (hasInheritance) {
    return node.baseContracts
      .filter(base => contractsToTranspile.map(o => o.contractName).includes(base.baseName.name))
      .map(base => {
        const mod = mods.find(mod => mod.modifierName.name === base.baseName.name);
        if (mod) {
          return buildSuperCall(mod.arguments, mod.modifierName.name, source);
        } else {
          return buildSuperCall(base.arguments, base.baseName.name, source);
        }
      });
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
  contractsToTranspile: Artifact[],
  contractsToArtifactsMap: Record<string, Artifact>,
): string {
  const chain = getInheritanceChain(contractNode.name, contractsToArtifactsMap);
  const mods = flatten(
    chain.map(art => {
      const node = getContract(art);
      const constructorNode = getConstructor(node);
      return constructorNode ? constructorNode.modifiers.filter(mod => isModifierInvocation(mod)) : [];
    }),
  );

  return [
    ...new Set(
      flatten(
        chain.map(base => {
          return buildSuperCalls(getContract(base), source, contractsToTranspile, mods).reverse();
        }),
      ),
    ),
  ]
    .reverse()
    .join('');
}
