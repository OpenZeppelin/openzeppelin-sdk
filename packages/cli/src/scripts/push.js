import ControllerFor from "../models/local/ControllerFor";

export default async function push({ network, deployStdlib, reupload = false, txParams = {}, packageFileName = undefined, networkFileName = undefined }) {
  const appController = ControllerFor(packageFileName).onNetwork(network, txParams, networkFileName);
  
  if (deployStdlib && !appController.isLib()) {
    await appController.deployStdlib();
  }
  await appController.push(reupload);
  appController.writeNetworkPackage();
}
