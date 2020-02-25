import NetworkController from '../models/network/NetworkController';
import { UpdateParams } from './interfaces';

export default async function update({
  packageName,
  contractName,
  proxyAddress,
  methodName,
  methodArgs,
  all,
  network,
  force = false,
  txParams = {},
  networkFile,
}: Partial<UpdateParams>) {
  if (!packageName && !contractName && !proxyAddress && !all) {
    throw Error(
      'The package name, contract name, or address to upgrade must be provided, or set the `all` flag to upgrade all contracts in the application.',
    );
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    await controller.logErrorIfProjectDeploymentIsInvalid(!force);
    const proxies = await controller.upgradeProxies(packageName, contractName, proxyAddress, methodName, methodArgs);
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
