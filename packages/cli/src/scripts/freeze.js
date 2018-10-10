import ControllerFor from '../models/network/ControllerFor'
import { Logger } from 'zos-lib'

const log = new Logger('scripts/freeze')

export default async function freeze({ network, txParams = {}, networkFile = undefined}) {
  const controller = new ControllerFor(network, txParams, networkFile)
  try {
    await controller.freeze();
  } catch(error) {
    log.error(error.message)
  } finally {
    controller.writeNetworkPackageIfNeeded()
  }
}
