import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor'

export default async function update({ packageName, contractAlias, proxyAddress, initMethod, initArgs, all, network, force = false, txParams = {}, networkFile = undefined}) {
  if (!packageName && !contractAlias && !proxyAddress && !all) {
    throw Error('The package name, contract name, or address to update must be provided, or set the `all` flag to update all contracts in the application.')
  }

  const controller = new ControllerFor(network, txParams, networkFile)

  try {
    await controller.checkLocalContractsDeployed(!force);
    const proxies = await controller.upgradeProxies(packageName, contractAlias, proxyAddress, initMethod, initArgs);
    proxies.forEach(proxy => stdout(proxy.address));
  } finally {
    controller.writeNetworkPackage();
  }
}
