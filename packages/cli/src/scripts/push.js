import stdout from '../utils/stdout';
import ControllerFor from "../models/network/ControllerFor";

export default async function push({ network, deployStdlib, reupload = false, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);
  
  try {
    if (deployStdlib && !controller.isLib) await controller.deployStdlib();
    await controller.push(reupload);
    stdout(controller.isLib ? controller.packageAddress : controller.appAddress);
  } finally {
    controller.writeNetworkPackage();
  }
}
