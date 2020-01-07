import { getContract, isContract } from './solc/ast-utils';
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
  const contractsToArtifactsMap = artifacts.reduce<Record<string | number, Artifact>>((acc, art) => {
    acc[art.contractName] = art;
    acc[getContract(art.ast, art.contractName).id] = art;
    return acc;
  }, {});

  const contractsWithInheritance = [
    ...new Set(contracts.map(contract => getInheritanceChain(contract, contractsToArtifactsMap)).flat()),
  ].filter(contract => {
    const artifact = contractsToArtifactsMap[contract];
    const contractNode = getContract(artifact.ast, contract);
    return isContract(contractNode);
  });

  const fileTrans = contractsWithInheritance.reduce<Record<string, FileTran>>((acc, contractName) => {
    const artifact = contractsToArtifactsMap[contractName];

    const source = artifact.source;

    const contractNode = getContract(artifact.ast, contractName);

    if (!acc[artifact.fileName]) {
      const directive = `\nimport "@openzeppelin/upgrades/contracts/Initializable.sol";`;

      acc[artifact.fileName] = {
        transformations: [
          appendDirective(artifact.ast, directive),
          ...fixImportDirectives(artifact, artifacts, contractsWithInheritance),
          ...purgeContracts(artifact.ast, contractsWithInheritance),
        ],
        source: '',
      };
    }

    acc[artifact.fileName].transformations = [
      ...acc[artifact.fileName].transformations,
      prependBaseClass(contractNode, source, 'Initializable'),
      ...transformParents(contractNode, source, contractsWithInheritance),
      ...transformConstructor(contractNode, source, contractsWithInheritance, contractsToArtifactsMap),
      ...purgeVarInits(contractNode, source),
      transformContractName(contractNode, source, `${contractName}Upgradable`),
    ];

    return acc;
  }, {});

  return contractsWithInheritance.reduce<OutputFile[]>((acc, contractName) => {
    const artifact = contractsToArtifactsMap[contractName];

    const source = artifact.source;

    const fileTran = fileTrans[artifact.fileName];
    if (!fileTran.source) {
      fileTran.source = transpile(source, fileTran.transformations);
    }
    const entry = acc.find(o => o.fileName === artifact.fileName);
    if (!entry) {
      acc.push({
        source: fileTran.source,
        path: artifact.sourcePath.replace('.sol', 'Upgradable.sol'),
        fileName: artifact.fileName,
        contracts: [contractName],
      });
    } else {
      entry.contracts.push(contractName);
    }
    return acc;
  }, []);
}

// async function main() {
//   const artifacts = fs.readdirSync('./build/contracts/').map(file => {
//     return JSON.parse(fs.readFileSync(`./build/contracts/${file}`));
//   });

//   const output = transpileContracts(
//     [
//       'GLDToken',
//       'InheritanceWithParamsClassChild',
//       'InheritanceWithParamsConstructorChild',
//       'Simple',
//       'DiamondC',
//       'NoInheritance',
//     ],
//     artifacts,
//   );

//   for (const file of output) {
//     let patchedFilePath = file.path;
//     if (file.path.startsWith('contracts')) {
//       patchedFilePath = file.path.replace('contracts/', '');
//     }
//     await fs.ensureDir(path.dirname(`./contracts/${patchedFilePath}`));
//     fs.writeFileSync(`./contracts/${patchedFilePath}`, file.source);
//   }
// }

// main().then(() => {
//   // waiting for the fix of an issue
//   // https://github.com/prettier-solidity/prettier-plugin-solidity/issues/211
//   // require("child_process").execSync("npx prettier --write **/*.sol");
// });
