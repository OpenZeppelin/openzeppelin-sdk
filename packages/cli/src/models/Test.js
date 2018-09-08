import ControllerFor from '../models/network/ControllerFor';

/**
 * Initializes a zOS application for testing, deploying it to the test network,
 * along with its standard library (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export async function TestApp(txParams = {}, networkFile = undefined) {
  const controller = new ControllerFor('test', txParams, networkFile)
  await controller.deployLibs()
  await controller.push()

  return controller.project
}

/**
 * Initializes a zOS stdlib for testing, deploying it to the test network,
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export async function TestLib(txParams = {}, networkFile = undefined) {
  const controller = new ControllerFor('test', txParams, networkFile)
  await controller.push()

  return controller.project
}
