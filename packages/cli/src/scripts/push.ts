import { transpileAndSave } from '../transpiler';
import { compile } from '../models/compiler/Compiler';

import ProjectFile from '../models/files/ProjectFile';

import NetworkController from '../models/network/NetworkController';
import { PushParams } from './interfaces';
import { fromContractFullName } from '../utils/naming';

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

  if (contracts || contracts.length !== 0) {
    // Transpile contract to upgradeable version and save it in contracts folder.
    await transpileAndSave(contracts);
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
