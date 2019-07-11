import NetworkController from '../models/network/NetworkController';
import NetworkFile from '../models/files/NetworkFile';
import { ProxyAdminProject, AppProject, TxParams } from '@openzeppelin/upgrades';

/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `NetworkFile` object to use, instead of zos.test.json
 */
export default async function(
  txParams: TxParams = {},
  networkFile?: NetworkFile,
): Promise<ProxyAdminProject | AppProject> {
  const controller = new NetworkController('test', txParams, networkFile);
  await controller.deployDependencies();
  await controller.push(false, true);

  return controller.project;
}
