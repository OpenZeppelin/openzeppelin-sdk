import NetworkController from '../models/network/NetworkController';
import { UpdateParams } from './interfaces';

export default async function update({
  packageName,
  contractAlias,
  proxyAddress,
  methodName,
  methodArgs,
  all,
  network,
  force = false,
  txParams = {},
  networkFile,
}: Partial<UpdateParams>) {
  if (!packageName && !contractAlias && !proxyAddress && !all) {
    throw Error(
      'The package name, contract name, or address to upgrade must be provided, or set the `all` flag to upgrade all contracts in the application.',
    );
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    await controller.checkLocalContractsDeployed(!force);
    const proxies = await controller.upgradeProxies(packageName, contractAlias, proxyAddress, methodName, methodArgs);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
