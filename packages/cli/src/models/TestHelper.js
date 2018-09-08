import ControllerFor from '../models/network/ControllerFor';

/**
 * Initializes a zOS application or stdlib project for testing, deploying it to the test network,
 * along with its standard library (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export default async function(txParams = {}, networkFile = undefined) {
  const controller = new ControllerFor('test', txParams, networkFile)
  if (!controller.isLib) await controller.deployLibs()
  await controller.push()

  return controller.project
}
