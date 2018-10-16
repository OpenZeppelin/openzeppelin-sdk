import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";
import ScriptError from '../models/errors/ScriptError'

export default async function push({ network, deployLibs, reupload = false, force = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployLibs && !controller.isLib) await controller.deployLibs();
    await controller.push(reupload, force);
    const address = controller.isLib ? controller.packageAddress : controller.appAddress;
    if (address) stdout(address);
    controller.writeNetworkPackageIfNeeded()
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error.message, cb)
  }
}
