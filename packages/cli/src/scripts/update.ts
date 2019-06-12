import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
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
}: UpdateParams) {
  if (!packageName && !contractAlias && !proxyAddress && !all) {
    throw Error(
      'The package name, contract name, or address to update must be provided, or set the `all` flag to update all contracts in the application.',
    );
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    await controller.checkLocalContractsDeployed(!force);
    const proxies = await controller.upgradeProxies(
      packageName,
      contractAlias,
      proxyAddress,
      methodName,
      methodArgs,
    );
    controller.writeNetworkPackageIfNeeded();
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
