import ControllerFor from '../models/network/ControllerFor'

export default async function freeze({ network, txParams = {}, networkFile = undefined}) {
  const controller = new ControllerFor(network, txParams, networkFile)
  await controller.freeze();
  controller.writeNetworkPackage();
}
