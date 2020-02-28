import NetworkController from '../models/network/NetworkController';
import { PushParams } from './interfaces';
import { fromContractFullName } from '../utils/naming';

export default async function push({
  contractAliases,
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

    const localContractAliases = contractAliases
      ?.map(fromContractFullName)
      .filter(({ package: packageName }) => packageName === undefined || packageName === controller.projectFile.name)
      .map(({ contract }) => contract);

    await controller.push(localContractAliases, { reupload, force });
    const { appAddress } = controller;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
