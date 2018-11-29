import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";
import ScriptError from '../models/errors/ScriptError'

export default async function push({ network, deployDependencies, reupload = false, force = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployDependencies) await controller.deployDependencies();
    await controller.push(reupload, force);
    const { appAddress } = controller
    if (appAddress) stdout(appAddress);
    controller.writeNetworkPackageIfNeeded()
  } catch (error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error, cb)
  }
}
