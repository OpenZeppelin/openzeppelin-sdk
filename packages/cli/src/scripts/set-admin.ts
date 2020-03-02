import NetworkController from '../models/network/NetworkController';
import { SetAdminParams } from './interfaces';

export default async function setAdmin({
  newAdmin,
  packageName,
  contractName,
  proxyAddress,
  network,
  txParams = {},
  networkFile,
}: SetAdminParams): Promise<void | never> {
  if (!contractName && !proxyAddress && packageName) {
    throw Error('The address or name of the contract to transfer upgradeability admin rights must be provided.');
  }

  if (!newAdmin) {
    throw Error('The address of the new admin must be provided.');
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    if (contractName || proxyAddress) {
      const proxies = await controller.setProxiesAdmin(packageName, contractName, proxyAddress, newAdmin);
    } else {
      await controller.setProxyAdminOwner(newAdmin);
    }
  } finally {
    controller.writeNetworkPackageIfNeeded();
  }
}
