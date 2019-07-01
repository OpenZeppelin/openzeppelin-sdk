import NetworkController from '../models/network/NetworkController';
import { VerifyParams } from './interfaces';

export default async function verify(
  contractAlias,
  {
    network = 'mainnet',
    txParams = {},
    networkFile,
    optimizer = false,
    optimizerRuns = 200,
    remote = 'etherchain',
    apiKey,
  }: VerifyParams,
): Promise<void | never> {
  if (!contractAlias) throw Error('A contract alias must be specified');
  if (remote === 'etherscan' && !apiKey)
    throw Error('Etherscan API key not specified. To get one, follow this link: https://etherscan.io/myapikey');

  const controller = new NetworkController(network, txParams, networkFile);
  controller.checkLocalContractDeployed(contractAlias, true);
  await controller.verifyAndPublishContract(contractAlias, optimizer, optimizerRuns as string, remote, apiKey);
}
