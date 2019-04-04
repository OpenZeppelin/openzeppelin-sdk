import stdout from '../utils/stdout';
import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { PushParams } from './interfaces';

export default async function push({ network, deployDependencies, deployProxyAdmin, deployProxyFactory, reupload = false, force = false, txParams = {}, networkFile }: PushParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    if (deployDependencies) await controller.deployDependencies();
    if (deployProxyAdmin) await controller.deployProxyAdmin();
    if (deployProxyFactory) await controller.deployProxyFactory();
    await controller.push(reupload, force);
    const { appAddress } = controller;
    if (appAddress) stdout(appAddress);
    controller.writeNetworkPackageIfNeeded();
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
