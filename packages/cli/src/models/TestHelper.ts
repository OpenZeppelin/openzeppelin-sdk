import NetworkController from '../models/network/NetworkController';
import ZosNetworkFile from '../models/files/ZosNetworkFile';
import { ProxyAdminProject, AppProject } from 'zos-lib';

/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `ZosNetworkFile` object to use, instead of zos.test.json
 */
export default async function(txParams: any = {}, networkFile?: ZosNetworkFile): Promise<ProxyAdminProject | AppProject> {
  const controller = new NetworkController('test', txParams, networkFile);
  await controller.deployDependencies();
  await controller.push(false, true);

  return controller.project;
}
