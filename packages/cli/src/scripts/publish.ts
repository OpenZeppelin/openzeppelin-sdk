import NetworkController from '../models/network/NetworkController';
import ScriptError from '../models/errors/ScriptError';
import { PublishParams } from './interfaces';

export default async function publish({ network, txParams = {}, networkFile }: PublishParams): Promise<void | never> {
  const controller = new NetworkController(network, txParams, networkFile);

  try {
    await controller.publish();
    controller.writeNetworkPackageIfNeeded();
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
