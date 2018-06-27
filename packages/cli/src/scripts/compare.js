import { Logger } from 'zos-lib'
import ControllerFor from '../models/network/ControllerFor'

export default async function compare({ network, txParams = {}, networkFile = undefined }) {
  const controller = ControllerFor(network, txParams, networkFile)
  await controller.compareCurrentStatus()
}
