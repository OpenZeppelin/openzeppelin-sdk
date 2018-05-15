import AppController from '../models/AppController';

export default async function push({ network, deployStdlib, reupload = false, txParams = {}, packageFileName = undefined, networkFileName = undefined }) {
  const appController = new AppController(packageFileName).onNetwork(network, txParams, networkFileName);
  
  if (deployStdlib) await appController.deployStdlib();
  await appController.push(reupload);
  appController.writeNetworkPackage();
}
