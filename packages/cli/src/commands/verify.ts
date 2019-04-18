import pickBy from 'lodash.pickby';

import verify from '../scripts/verify';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import Truffle from '../models/initializer/truffle/Truffle';
import { promptIfNeeded, contractsList, networksList, InquirerQuestions } from '../utils/prompt';

const name: string = 'verify';
const signature: string = `${name} [contract-alias]`;
const description: string = 'verify a contract with etherscan or etherchain. Provide a contract name.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .description(description)
  .option('-n, --network [network]', 'network where to verify the contract')
  .option('-o, --optimizer', 'enables optimizer option')
  .option('--optimizer-runs [runs]', 'specify number of runs if optimizer enabled.')
  .option('--remote <remote>', 'specify remote endpoint to use for verification')
  .option('--api-key <key>', 'specify etherscan API key. To get one, go to: https://etherscan.io/myapikey')
  .withNonInteractiveOption()
  .action(action);

async function action(contractName: string, options: any): Promise<void> {
  const { optimizer, optimizerRuns, remote, apiKey, network: networkName, interactive } = options;
  const args = { contractName };
  const opts = { network: networkName, optimizer, optimizerRuns, remote, apiKey };
  const defaults= Truffle.getCompilerInfo();
  const props = setCommandProps(optimizer);

  const prompted = await promptIfNeeded({ args, opts, defaults, props }, interactive);
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(prompted);

  await verify(prompted.contractName, { ...prompted, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function setCommandProps(optimizerEnabled: boolean): InquirerQuestions {
  return {
    ...contractsList('contractName', 'Choose a contract', 'list', 'fromLocal'),
    ...networksList('network', 'Select a network from the network list', 'list'),
    optimizer: {
      type: 'confirm',
      message: 'Was the optimizer enabled when you compiled your contracts?',
      default: false
    },
    optimizerRuns: {
      type: 'input',
      message: 'Specify the optimizer runs',
      when: ({ optimizer }) => optimizer || optimizerEnabled
    },
    remote: {
      type: 'list',
      message: 'Select an endpoint',
      choices: ['etherscan', 'etherchain'],
      default: 'etherscan'
    },
    apiKey: {
      type: 'input',
      message: 'Provide an etherscan API KEY',
      when: ({ remote }) => remote === 'etherscan'
    },
  };
}

export default { name, signature, description, register, action };
