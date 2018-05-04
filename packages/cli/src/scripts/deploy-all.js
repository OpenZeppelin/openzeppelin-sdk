import AppController from '../models/AppController';

export default async function deployAll({ network, txParams = {}, packageFileName = null }) {
  const appController = new AppController(packageFileName).onNetwork(network, txParams);
  
  await appController.deployStdlib();
  await appController.sync();
  appController.writeNetworkPackage();
}
