import ControllerFor from '../models/network/ControllerFor';
import ZosNetworkFile from '../models/files/ZosNetworkFile';
import { ProxyAdminProject, AppProject } from 'zos-lib';

/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export default async function(txParams: any = {}, networkFile?: ZosNetworkFile): Promise<ProxyAdminProject | AppProject> {
  const controller = ControllerFor('test', txParams, networkFile);
  await controller.deployDependencies();
  await controller.push();

  return controller.project;
}
