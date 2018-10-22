import ControllerFor from '../models/network/ControllerFor'
import ScriptError from '../models/errors/ScriptError'

export default async function pull({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile)
  try {
    await controller.pullRemoteStatus()
    controller.writeNetworkPackageIfNeeded()
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error, cb)
  }
}
