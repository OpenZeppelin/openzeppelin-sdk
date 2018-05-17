import ControllerFor from "../models/local/ControllerFor";
import stdout from '../utils/stdout';

export default async function push({ network, deployStdlib, reupload = false, txParams = {}, packageFileName = undefined, networkFileName = undefined }) {
  const appController = ControllerFor(packageFileName).onNetwork(network, txParams, networkFileName);
  
  if (deployStdlib && !appController.isLib()) {
    await appController.deployStdlib();
  }
  await appController.push(reupload);
  appController.writeNetworkPackage();
  stdout(appController.isLib() ? appController.packageAddress : appController.appAddress);
}
