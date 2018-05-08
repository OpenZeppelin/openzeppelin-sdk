import AppController from '../models/AppController';

export default async function sync({ network, deployStdlib, txParams = {}, packageFileName = undefined, networkFileName = undefined }) {
  const appController = new AppController(packageFileName).onNetwork(network, txParams, networkFileName);
  
  if (deployStdlib) await appController.deployStdlib();
  await appController.sync();
  appController.writeNetworkPackage();
}
