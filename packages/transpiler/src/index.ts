import flatten from 'lodash.flatten';

import { getContract, isContract, throwIfInvalidNode } from './solc/ast-utils';
import { transpile } from './transpiler';
import {
  transformConstructor,
  transformContractName,
  appendDirective,
  prependBaseClass,
  purgeContracts,
  transformParents,
  fixImportDirectives,
  purgeVarInits,
} from './transformations/index';
import { getInheritanceChain } from './solc/get-inheritance-chain';
import { Artifact } from './solc/artifact';
import { Transformation } from './transformation';

export interface OutputFile {
  fileName: string;
  source: string;
  path: string;
  contracts: string[];
}

interface FileTran {
  transformations: Transformation[];
  source: string;
}

export function transpileContracts(contracts: string[], artifacts: Artifact[]): OutputFile[] {
  // check that we have valid ast tree
  for (const art of artifacts) {
    throwIfInvalidNode(art.ast);
  }

  // create contract name | id to artifact map for quick access to artifacts
  const contractsToArtifactsMap = artifacts.reduce<Record<string | number, Artifact>>((acc, art) => {
    acc[art.contractName] = art;
    const contract = getContract(art.ast, art.contractName);
    acc[contract.id] = art;
    return acc;
  }, {});

  // build a list of all contracts to transpile
  const contractsWithInheritance = [
    ...new Set(flatten(contracts.map(contract => getInheritanceChain(contract, contractsToArtifactsMap)))),
  ].filter(contract => {
    const art = contractsToArtifactsMap[contract];
    const contractNode = getContract(art.ast, contract);
    return isContract(contractNode);
  });

  // build a array of transformations per Solidity file
  const fileTrans = contractsWithInheritance.reduce<Record<string, FileTran>>((acc, contractName) => {
    const art = contractsToArtifactsMap[contractName];

    const source = art.source;

    const contractNode = getContract(art.ast, contractName);

    if (!acc[art.fileName]) {
      const directive = `\nimport "@openzeppelin/upgrades/contracts/Initializable.sol";`;

      acc[art.fileName] = {
        transformations: [
          appendDirective(art.ast, directive),
          ...fixImportDirectives(art, artifacts, contractsWithInheritance),
          ...purgeContracts(art.ast, contractsWithInheritance),
        ],
        source: '',
      };
    }

    acc[art.fileName].transformations = [
      ...acc[art.fileName].transformations,
      prependBaseClass(contractNode, source, 'Initializable'),
      ...transformParents(contractNode, source, contractsWithInheritance),
      ...transformConstructor(contractNode, source, contractsWithInheritance, contractsToArtifactsMap),
      ...purgeVarInits(contractNode, source),
      transformContractName(contractNode, source, `${contractName}Upgradable`),
    ];

    return acc;
  }, {});

  // build a final array of files to return
  return contractsWithInheritance.reduce<OutputFile[]>((acc, contractName) => {
    const artifact = contractsToArtifactsMap[contractName];

    const source = artifact.source;

    const fileTran = fileTrans[artifact.fileName];
    if (!fileTran.source) {
      fileTran.source = transpile(source, fileTran.transformations);
    }
    const entry = acc.find(o => o.fileName === artifact.fileName);
    if (!entry) {
      const path = artifact.sourcePath.replace('.sol', 'Upgradable.sol');
      let patchedFilePath = path;
      if (path.startsWith('contracts')) {
        patchedFilePath = path.replace('contracts/', '');
      }
      patchedFilePath = `./contracts/__upgradable__/${patchedFilePath}`;
      acc.push({
        source: fileTran.source,
        path: patchedFilePath,
        fileName: artifact.fileName,
        contracts: [contractName],
      });
    } else {
      entry.contracts.push(contractName);
    }
    return acc;
  }, []);
}
