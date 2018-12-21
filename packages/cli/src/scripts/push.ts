import stdout from '../utils/stdout';
import ControllerFor from '../models/network/ControllerFor';
import ScriptError from '../models/errors/ScriptError';
import { PushParams } from './interfaces';

export default async function push({ network, deployDependencies, reupload = false, force = false, txParams = {}, networkFile }: PushParams): Promise<void | never> {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployDependencies) await controller.deployDependencies();
    await controller.push(reupload, force);
    const { appAddress } = controller;
    if (appAddress) stdout(appAddress);
    controller.writeNetworkPackageIfNeeded();
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
