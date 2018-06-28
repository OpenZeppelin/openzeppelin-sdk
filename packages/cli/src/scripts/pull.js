import ControllerFor from '../models/network/ControllerFor'

export default async function pull({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile)
  await controller.pullRemoteStatus()
  controller.writeNetworkPackage()
}
