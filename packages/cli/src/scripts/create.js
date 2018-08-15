import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor';

export default async function createProxy({ packageName, contractAlias, initMethod, initArgs, network, txParams = {}, force = false, networkFile = undefined }) {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.')

  const controller = ControllerFor(network, txParams, networkFile)
  await controller.checkLocalContractDeployed(contractAlias, !force);
  const proxy = await controller.createProxy(packageName, contractAlias, initMethod, initArgs);

  controller.writeNetworkPackage();
  stdout(proxy.address);
  return proxy;
}
