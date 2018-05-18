import LocalAppController from '../models/local/LocalAppController';

export default async function testApp(packageFileName, txParams = {}) {
  const appController = new LocalAppController(packageFileName || 'zos.json', true).onNetwork('test', txParams);
  await appController.deployStdlib();
  await appController.push();
  return appController.app;
}