import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { SetAdminParams } from './interfaces';

export default async function setAdmin({ newAdmin, packageName, contractAlias, proxyAddress, network, txParams = {}, networkFile }: SetAdminParams): Promise<void | never> {
  if (!contractAlias && !proxyAddress && packageName) {
    throw Error('The address or name of the contract to transfer upgradeability admin rights must be provided.');
  }

  if (!newAdmin) {
    throw Error('The address of the new admin must be provided.');
  }

  const controller = new NetworkController(network, txParams, networkFile);

  try {
    if (contractAlias || proxyAddress) {
      const proxies = await controller.setProxiesAdmin(packageName, contractAlias, proxyAddress, newAdmin);
      proxies.forEach((proxy) => stdout(proxy.address));
    } else {
      await controller.setProxyAdminOwner(newAdmin);
    }
    controller.writeNetworkPackageIfNeeded();
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
