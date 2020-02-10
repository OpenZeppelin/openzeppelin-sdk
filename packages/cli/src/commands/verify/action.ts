import NetworkController from '../../models/network/NetworkController';
import { Options, Args } from './spec';
import ConfigManager from '../../models/config/ConfigManager';

import ProjectFile from '../../models/files/ProjectFile';

export async function action(params: Options & Args & { dontExitProcess: boolean }): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    const { network } = await ConfigManager.initNetworkConfiguration(params);
    Object.assign(params, { network });
  }

  const controller = new NetworkController(params.network, params.txParams, params.networkFile);

  controller.checkLocalContractDeployed(params.contract, true);

  await controller.verifyAndPublishContract(
    params.contract,
    params.optimizer,
    (params as any).optimizerRuns ?? 200,
    params.remote,
    (params as any).apiKey ?? '',
  );

  if (!params.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}
