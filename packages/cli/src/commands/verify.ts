import { Command } from 'commander';
import _ from 'lodash';

import verify from '../scripts/verify';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'verify';
const signature: string = `${name} <contract-alias>`;
const description: string = 'verify a contract with etherchain. Provide a contract name.';


const register: (program: Command) => Command = (program) => program
  .command(signature, undefined, { noHelp: true })
  .description(description)
  .option('-n, --network <network>', 'network where to verify the contract')
  .option('-o, --optimizer', 'enables optimizer option')
  .option('--optimizer-runs <runs>', 'specify number of runs if optimizer enabled.')
  .option('--remote <remote>', 'specify remote endpoint to use for verification')
  .option('--api-key <key>', 'specify etherscan API key. To get one, go to: https://etherscan.io/myapikey')
  .action(action);

async function action(contractAlias: string, options: Command): Promise<void | never> {
  const { optimizer, optimizerRuns, remote, apiKey } = options;
  if (optimizer && !optimizerRuns) {
    throw new Error('Cannot verify contract without defining optimizer runs');
  }
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  const opts = _.pickBy({ optimizer, optimizerRuns, remote, apiKey, network, txParams });
  await verify(contractAlias, { optimizer, optimizerRuns, remote, apiKey, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
