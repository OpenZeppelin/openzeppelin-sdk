import { flatten } from 'lodash';

import { getContract, isContract, throwIfInvalidNode } from './solc/ast-utils';
import { transpile } from './transpiler';
import {
  transformConstructor,
  transformContractName,
  appendDirective,
  prependBaseClass,
  purgeExceptContracts,
  transformParentsNames,
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

interface FileTransformation {
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
    const contract = getContract(art);
    acc[contract.id] = art;
    return acc;
  }, {});

  // build a list of all contracts to transpile
  const contractsToTranspile = [
    ...new Set(flatten(contracts.map(contract => getInheritanceChain(contract, contractsToArtifactsMap)))),
  ].filter(art => {
    const contractNode = getContract(art);
    return isContract(contractNode);
  });

  // build a array of transformations per Solidity file
  const fileTrans = contractsToTranspile.reduce<Record<string, FileTransformation>>((acc, art) => {
    const contractName = art.contractName;

    const source = art.source;

    const contractNode = getContract(art);

    if (!acc[art.fileName]) {
      const directive = `\nimport "@openzeppelin/upgrades/contracts/Initializable.sol";`;

      acc[art.fileName] = {
        transformations: [
          appendDirective(art.ast, directive),
          ...fixImportDirectives(art, artifacts, contractsToTranspile),
          ...purgeExceptContracts(art.ast, contractsToTranspile),
        ],
        source: '',
      };
    }

    acc[art.fileName].transformations = [
      ...acc[art.fileName].transformations,
      prependBaseClass(contractNode, source, 'Initializable'),
      ...transformParentsNames(contractNode, source, contractsToTranspile),
      ...transformConstructor(contractNode, source, contractsToTranspile, contractsToArtifactsMap),
      ...purgeVarInits(contractNode, source),
      transformContractName(contractNode, source, `${contractName}Upgradable`),
    ];

    return acc;
  }, {});

  // build a final array of files to return
  return contractsToTranspile.reduce<OutputFile[]>((acc, art) => {
    const contractName = art.contractName;

    const source = art.source;

    const fileTran = fileTrans[art.fileName];
    if (!fileTran.source) {
      fileTran.source = transpile(source, fileTran.transformations);
    }
    const entry = acc.find(o => o.fileName === art.fileName);
    if (!entry) {
      const path = art.sourcePath.replace('.sol', 'Upgradable.sol');
      let patchedFilePath = path;
      if (path.startsWith('contracts')) {
        patchedFilePath = path.replace('contracts/', '');
      }
      patchedFilePath = `./contracts/__upgradable__/${patchedFilePath}`;
      acc.push({
        source: fileTran.source,
        path: patchedFilePath,
        fileName: art.fileName,
        contracts: [contractName],
      });
    } else {
      entry.contracts.push(contractName);
    }
    return acc;
  }, []);
}
