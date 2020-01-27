import pickBy from 'lodash.pickby';

import sendTx from '../scripts/send-tx';
import { SendTxParams } from '../scripts/interfaces';
import { parseContractReference } from '../utils/contract';
import ConfigManager from '../models/config/ConfigManager';
import {
  promptIfNeeded,
  networksList,
  promptForNetwork,
  proxiesList,
  proxyInfo,
  InquirerQuestions,
} from '../prompts/prompt';
import { SendTxSelectionParams } from './interfaces';
import promptForMethodParams from '../prompts/method-params';
import Telemetry from '../telemetry';

const name = 'send-tx';
const signature: string = name;
const description =
  'send a transaction to the specified contract instance. Provide the [address], method to call and its arguments if needed';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('--to <to> --method <method> [options]')
    .description(description)
    .option('--to <to>', 'address of the contract that will receive the transaction')
    .option('--method <method>', `name of the method to execute in the contract`)
    .option('--args <arg1, arg2, ...>', 'arguments to the method to execute')
    .option('--value <value>', `optional value in wei to send with the transaction`)
    .option(
      '--gas <gas>',
      `gas limit of the transaction, will default to the limit specified in the configuration file, or use gas estimation if not set`,
    )
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(options: any): Promise<void> {
  const { interactive, to: proxyAddress, value, gas } = options;
  const networkOpts = await promptForNetwork(options, () => getCommandProps());
  const { network, txParams } = await ConfigManager.initNetworkConfiguration({
    ...options,
    ...networkOpts,
  });

  const { contractFullName, proxyReference } = await promptForProxy(proxyAddress, network, options);
  const methodParams = await promptForMethodParams(contractFullName, options);
  const args = pickBy({
    ...methodParams,
    proxyAddress: proxyReference,
    value,
    gas,
  } as SendTxParams);

  await Telemetry.report('send-tx', { ...args, network, txParams }, interactive);
  await sendTx({ ...args, network, txParams });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForProxy(proxyAddress: string, network: string, options: any): Promise<SendTxSelectionParams> {
  const { interactive } = options;
  const opts = { proxy: proxyAddress };
  const props = getCommandProps(network);
  const { proxy: promptedProxy } = await promptIfNeeded({ opts, props }, interactive);

  return promptedProxy;
}

function getCommandProps(network?: string): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    proxy: {
      message: 'Pick an instance',
      type: 'list',
      choices: proxiesList('byAddress', network),
      normalize: input => (typeof input !== 'object' ? proxyInfo(parseContractReference(input), network) : input),
    },
  };
}

export default { name, signature, description, register, action };
