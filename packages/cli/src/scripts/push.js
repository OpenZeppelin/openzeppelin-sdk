import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";
import ScriptError from '../models/errors/ScriptError'

export default async function push({ network, deployLibs, full = false, reupload = false, force = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployLibs && !controller.isLib) await controller.deployLibs();
    if (full) await controller.toFullApp();
    await controller.push(reupload, force);
    stdout(controller.isLib ? controller.packageAddress : controller.appAddress);
    controller.writeNetworkPackageIfNeeded()
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error.message, cb)
  }
}
