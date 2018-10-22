import ControllerFor from '../models/network/ControllerFor'
import ScriptError from '../models/errors/ScriptError'

export default async function freeze({ network, txParams = {}, networkFile = undefined}) {
  const controller = new ControllerFor(network, txParams, networkFile)
  try {
    await controller.freeze();
    controller.writeNetworkPackageIfNeeded()
  } catch(error) {
    const cb = () => controller.writeNetworkPackageIfNeeded()
    throw new ScriptError(error, cb)
  }
}
