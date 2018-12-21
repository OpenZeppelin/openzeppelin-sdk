import ControllerFor from '../models/network/ControllerFor';
import ScriptError from '../models/errors/ScriptError';
import { FreezeParams } from './interfaces';

export default async function freeze({ network, txParams = {}, networkFile }: FreezeParams): Promise<void | never> {
  const controller = ControllerFor(network, txParams, networkFile);
  try {
    await controller.freeze();
    controller.writeNetworkPackageIfNeeded();
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
