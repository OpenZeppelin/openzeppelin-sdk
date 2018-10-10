import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";
import { Logger } from 'zos-lib'

const log = new Logger('scripts/push')

export default async function push({ network, deployLibs, reupload = false, force = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);

  try {
    if (deployLibs && !controller.isLib) await controller.deployLibs();
    await controller.push(reupload, force);
    stdout(controller.isLib ? controller.packageAddress : controller.appAddress);
  } catch(error) {
    log.error(error.message)
  } finally {
    controller.writeNetworkPackageIfNeeded()
  }
}
