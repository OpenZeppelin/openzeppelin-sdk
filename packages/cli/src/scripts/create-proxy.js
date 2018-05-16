import LocalAppController from '../models/local/LocalAppController';

export default async function createProxy({ contractAlias, initMethod, initArgs, network, txParams = {}, packageFileName = undefined, networkFileName = undefined, force = false }) {
  if (!contractAlias) throw Error('A contract alias must be provided to create a new proxy.')

  const appController = new LocalAppController(packageFileName).onNetwork(network, txParams, networkFileName);
  await appController.checkLocalContractDeployed(contractAlias, !force);
  const proxy = await appController.createProxy(contractAlias, initMethod, initArgs);
  appController.writeNetworkPackage();
  return proxy;
}