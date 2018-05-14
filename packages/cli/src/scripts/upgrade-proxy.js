import AppController from "../models/AppController";

export default async function upgradeProxy({ contractAlias, proxyAddress, initMethod, initArgs, all, network, txParams = {}, packageFileName = undefined, networkFileName = undefined, force = false }) {
  if (!contractAlias && !all) {
    throw Error('The contract name to upgrade must be provided, or explicit upgrading all proxies in the application.')
  }

  const appController = new AppController(packageFileName).onNetwork(network, txParams, networkFileName);
  await appController.checkLocalContractsDeployed(!force);
  await appController.upgradeProxies(contractAlias, proxyAddress, initMethod, initArgs);
  appController.writeNetworkPackage();
}
