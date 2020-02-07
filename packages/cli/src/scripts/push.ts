import NetworkController from '../models/network/NetworkController';
import { PushParams } from './interfaces';

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
    await controller.push(contractAliases, { reupload, force });
    const { appAddress } = controller;
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
