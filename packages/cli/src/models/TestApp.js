import ControllerFor from '../models/network/ControllerFor';

export default async function testApp(networkFile = undefined, txParams = {}) {
  const controller = new ControllerFor('test', txParams, networkFile)
  await controller.deployStdlib();
  await controller.push();
  return controller.app;
}