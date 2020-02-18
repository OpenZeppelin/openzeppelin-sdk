import NetworkController from '../../models/network/NetworkController';
import { Options, Args } from './spec';

export async function action(params: Options & Args & { dontExitProcess: boolean }): Promise<void> {
  const { userNetworkName } = params;

  const controller = new NetworkController(params.network, params.txParams, params.networkFile);

  try {
    controller.checkLocalContractDeployed(params.contract, true);
  } catch (e) {
    if (!e.message.includes('has changed locally')) {
      e.message += '\n\nVerification of regular instances is not yet supported.';
    }
    throw e;
  }

  await controller.verifyAndPublishContract(
    params.contract,
    params.optimizer,
    (params as any).optimizerRuns ?? 200,
    params.remote,
    (params as any).apiKey ?? '',
  );

  if (!params.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}
