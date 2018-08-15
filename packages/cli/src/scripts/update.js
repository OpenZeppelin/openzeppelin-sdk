import _ from 'lodash';
import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor'

export default async function update({ packageName, contractAlias, proxyAddress, initMethod, initArgs, all, network, force = false, txParams = {}, networkFile = undefined}) {
  if (!contractAlias && !all) {
    throw Error('The contract name to update must be provided, or explicit upgrading all proxies in the application.')
  }

  const controller = new ControllerFor(network, txParams, networkFile)

  try {
    await controller.checkLocalContractsDeployed(!force);
    const proxies = await controller.upgradeProxies(packageName, contractAlias, proxyAddress, initMethod, initArgs);
    _.forEach(proxies, proxy => stdout(proxy.address));
  } finally {
    controller.writeNetworkPackage();
  }
}
