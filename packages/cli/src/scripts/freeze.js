import LocalLibController from '../models/local/LocalLibController'

export default async function freeze({ network, txParams = {}, packageFileName = undefined, networkFileName = undefined }) {
  const appController = new LocalLibController(packageFileName).onNetwork(network, txParams, networkFileName)
  await appController.freeze();
  appController.writeNetworkPackage();
}
