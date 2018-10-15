import ControllerFor from "../models/network/ControllerFor";

export default async function publish({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile);
  
  try {
    await controller.toFullApp();
  } finally {
    controller.writeNetworkPackage();
  }
}
