import { Separator } from 'inquirer';

import { difference, flatten } from 'lodash';
import ProjectFile from '../models/files/ProjectFile';
import ContractManager from '../models/local/ContractManager';
import Dependency from '../models/dependency/Dependency';

export type Choice = string | { name: string; value: string } | { type: 'separator' };

export type ContractsSource = 'built' | 'notAdded' | 'added' | 'all';

// Generate a list of contracts names
export function contracts(source: ContractsSource = 'built'): Choice[] {
  const localProjectFile = new ProjectFile();
  const contractManager = new ContractManager(localProjectFile);

  const contractsFromBuild: Choice[] = contractManager.getContractNames();
  const contractsFromLocal = Object.keys(localProjectFile.contracts)
    .map(alias => ({ name: localProjectFile.contracts[alias], alias }))
    .map(({ name: contractName, alias }) => {
      const label = contractName === alias ? alias : `${alias}[${contractName}]`;
      return { name: label, value: alias };
    });

  // get contracts from build/contracts
  if (source === 'built') {
    return contractsFromBuild;
  }

  // get contracts from project.json file
  if (source === 'added') {
    return contractsFromLocal;
  }

  // get contracts from build/contracts that are not in project.json file
  if (source === 'notAdded') {
    return difference(
      contractsFromBuild,
      contractsFromLocal.map(c => c.value),
    );
  }

  // generate a list of built contracts and package contracts
  if (source === 'all') {
    const packageContracts = Object.keys(localProjectFile.dependencies).map(dependencyName => {
      const contractNames: Choice[] = new Dependency(dependencyName).projectFile.contractAliases.map(
        contractName => `${dependencyName}/${contractName}`,
      );

      if (contractNames.length > 0) {
        contractNames.unshift(new Separator(` = ${dependencyName} =`));
      }
      return contractNames;
    });
    if (contractsFromBuild.length > 0) {
      contractsFromBuild.unshift(new Separator(` = Your contracts =`));
    }

    return [...contractsFromBuild, ...flatten(packageContracts)];
  }
}
