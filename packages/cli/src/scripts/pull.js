import ControllerFor from '../models/network/ControllerFor'
import { Logger } from 'zos-lib'

const log = new Logger('scripts/pull')

export default async function pull({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile)
  try {
    await controller.pullRemoteStatus()
  } catch(error) {
    log.error(error.message)
  } finally {
    controller.writeNetworkPackageIfNeeded()
  }
}
