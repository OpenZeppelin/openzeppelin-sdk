import ControllerFor from '../models/network/ControllerFor';

/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export default async function(txParams = {}, networkFile = undefined) {
  const controller = new ControllerFor('test', txParams, networkFile)
  await controller.deployDependencies()
  await controller.push()

  return controller.project
}
