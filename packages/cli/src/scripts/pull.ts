import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { PullParams } from './interfaces';

export default async function pull({
  network,
  txParams = {},
  networkFile,
}: PullParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);
  try {
    await controller.pullRemoteStatus();
    controller.writeNetworkPackageIfNeeded();
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
