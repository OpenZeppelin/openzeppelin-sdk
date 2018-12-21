import ControllerFor from '../models/network/ControllerFor';
import { VerifyParams } from './interfaces';

export default async function verify(contractAlias, { network = 'mainnet', txParams = {}, networkFile, optimizer = false, optimizerRuns = 200, remote = 'etherchain', apiKey }: VerifyParams): Promise<void | never> {
  if (remote === 'etherscan' && !apiKey) throw new Error('Etherscan API key not specified. To get one, follow this link: https://etherscan.io/myapikey');

  const controller = ControllerFor(network, txParams, networkFile);
  controller.checkLocalContractDeployed(contractAlias, true);
  await controller.verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote, apiKey);
}
