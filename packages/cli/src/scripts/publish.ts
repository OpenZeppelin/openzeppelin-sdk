import ControllerFor from '../models/network/ControllerFor';
import ScriptError from '../models/errors/ScriptError';
import { PublishParams } from './interfaces';

export default async function publish({ network, txParams = {}, networkFile }: PublishParams): Promise<void | never> {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    await controller.toFullApp();
    controller.writeNetworkPackageIfNeeded();
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
