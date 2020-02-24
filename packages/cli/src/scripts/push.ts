import NetworkController from '../models/network/NetworkController';
import { PushParams } from './interfaces';

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
  transpiledContracts,
}: PushParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    if (deployDependencies) await controller.deployDependencies();
    if (deployProxyAdmin) await controller.deployProxyAdmin();
    if (deployProxyFactory) await controller.deployProxyFactory();
    await controller.push(contracts, { reupload, force, transpiledContracts });
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
