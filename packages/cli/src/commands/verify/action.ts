import NetworkController from '../../models/network/NetworkController';
import { Options, Args } from './spec';

export async function action(params: Options & Args & { dontExitProcess: boolean }): Promise<void> {
  const { userNetworkName } = params;

  const controller = new NetworkController(params.network, params.txParams, params.networkFile);

  if (!controller.isContractDeployed(params.contract)) {
    throw new Error(
      `Contract '${params.contract}' is not deployed to '${userNetworkName}'.\n\nVerification of regular instances is not yet supported.`,
    );
  }

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
