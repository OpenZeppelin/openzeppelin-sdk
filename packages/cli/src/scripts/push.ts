import { map, flatten } from 'lodash';

import { transpileAndSave } from '../transpiler';
import { compile } from '../models/compiler/Compiler';

import ProjectFile from '../models/files/ProjectFile';

import NetworkController from '../models/network/NetworkController';
import { PushParams } from './interfaces';
import { fromContractFullName } from '../utils/naming';
import Dependency from '../models/dependency/Dependency';

export default async function push({
  contracts,
  network,
  deployDependencies,
  deployProxyAdmin,
  deployProxyFactory,
  reupload = false,
  force = false,
  txParams = {},
  networkFile,
}: PushParams): Promise<void | never> {
  if (!contracts || contracts.length === 0) {
    if (!!networkFile) {
      contracts = networkFile.projectFile.contracts;
    } else {
      contracts = new ProjectFile().contracts;
    }
  }

  const depsContracts = deployDependencies
    ? flatten(map(new ProjectFile().dependencies, (version, dep) => new Dependency(dep, version).projectFile.contracts))
    : [];

  if (!!depsContracts.length || !!contracts.length) {
    // Transpile contract to upgradeable version and save it in contracts folder.
    await transpileAndSave([...contracts, ...depsContracts]);
    // Compile new contracts.
    await compile(undefined, undefined, true);
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    if (deployDependencies) await controller.deployDependencies();
    if (deployProxyAdmin) await controller.deployProxyAdmin();
    if (deployProxyFactory) await controller.deployProxyFactory();

    const projectContracts = contracts
      ?.map(fromContractFullName)
      .filter(({ package: packageName }) => packageName === undefined || packageName === controller.projectFile.name)
      .map(({ contractName }) => contractName);

    await controller.push(projectContracts, { reupload, force });
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
