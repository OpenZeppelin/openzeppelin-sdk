import ControllerFor from "../models/network/ControllerFor";
import ScriptError from '../models/errors/ScriptError';

export default async function publish({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);
  
  try {
    await controller.toFullApp();
    controller.writeNetworkPackageIfNeeded();
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded();
    throw new ScriptError(error, cb);
  }
}
