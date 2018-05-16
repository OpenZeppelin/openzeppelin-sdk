import LocalAppController from "../models/local/LocalAppController";

export default async function upgradeProxy({ contractAlias, proxyAddress, initMethod, initArgs, all, network, txParams = {}, packageFileName = undefined, networkFileName = undefined, force = false }) {
  if (!contractAlias && !all) {
    throw Error('The contract name to upgrade must be provided, or explicit upgrading all proxies in the application.')
  }

  const appController = new LocalAppController(packageFileName).onNetwork(network, txParams, networkFileName);
  await appController.checkLocalContractsDeployed(!force);
  await appController.upgradeProxies(contractAlias, proxyAddress, initMethod, initArgs);
  appController.writeNetworkPackage();
}
