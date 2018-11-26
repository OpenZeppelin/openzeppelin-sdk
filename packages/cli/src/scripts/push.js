import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";
import ScriptError from '../models/errors/ScriptError'

export default async function push({ network, deployLibs, reupload = false, force = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployLibs) await controller.deployLibs();
    await controller.push(reupload, force);
    const { appAddress } = controller
    if (appAddress) stdout(appAddress);
    controller.writeNetworkPackageIfNeeded()
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error, cb)
  }
}
