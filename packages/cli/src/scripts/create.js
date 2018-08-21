import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor';

export default async function create({ contractAlias, initMethod, initArgs, network, txParams = {}, force = false, upgradeable = true, networkFile = undefined }) {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new instance.')

  const controller = ControllerFor(network, txParams, networkFile)
  await controller.checkLocalContractDeployed(contractAlias, !force);
  const instance = await controller.createInstance(contractAlias, upgradeable, initMethod, initArgs)

  controller.writeNetworkPackage();
  stdout(instance.address);
  return instance;
}
