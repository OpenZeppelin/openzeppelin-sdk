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
    const { appAddress } = controller;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
