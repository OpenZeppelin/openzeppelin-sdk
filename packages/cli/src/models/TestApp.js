import ControllerFor from '../models/network/ControllerFor';

/**
 * Initializes a zOS application for testing, deploying it to the test network,
 * along with its standard library (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export default async function testApp(txParams = {}, networkFile = undefined) {
  const controller = new ControllerFor('test', txParams, networkFile)
  await controller.deployStdlib();
  await controller.push();
  return controller.app;
}