import verify from '../scripts/verify';
import ConfigManager from '../models/config/ConfigManager';
import {
  promptIfNeeded,
  contractsList,
  networksList,
  InquirerQuestions,
} from '../prompts/prompt';

const name = 'verify';
const signature = `${name} [contract-alias]`;
const description =
  'verify a contract with etherscan or etherchain. Provide a contract name.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .option('-n, --network [network]', 'network where to verify the contract')
    .option('-o, --optimizer', 'enables optimizer option')
    .option(
      '--optimizer-runs [runs]',
      'specify number of runs if optimizer enabled.',
    )
    .option(
      '--remote <remote>',
      'specify remote endpoint to use for verification',
    )
    .option(
      '--api-key <key>',
      'specify etherscan API key. To get one, go to: https://etherscan.io/myapikey',
    )
    .withNonInteractiveOption()
    .action(action);

async function action(contractName: string, options: any): Promise<void> {
  const {
    optimizer,
    optimizerRuns,
    remote,
    apiKey,
    network: networkName,
    interactive,
  } = options;
  const args = { contractName };
  const opts = {
    network: networkName,
    optimizer,
    optimizerRuns,
    remote,
    apiKey,
  };
  const defaults = ConfigManager.getCompilerInfo();
  const props = getCommandProps(optimizer);

  const prompted = await promptIfNeeded(
    { args, opts, defaults, props },
    interactive,
  );
  const { network, txParams } = await ConfigManager.initNetworkConfiguration(
    prompted,
  );

  await verify(prompted.contractName, { ...prompted, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

function getCommandProps(optimizerEnabled: boolean): InquirerQuestions {
  return {
    ...contractsList('contractName', 'Choose a contract', 'list', 'added'),
    ...networksList('network', 'list'),
    optimizer: {
      type: 'confirm',
      message: 'Was the optimizer enabled when you compiled your contracts?',
      default: false,
      when: ({ contractName }) => contractName,
    },
    optimizerRuns: {
      type: 'input',
      message: 'Specify the optimizer runs',
      when: ({ optimizer, contractName }) =>
        contractName && (optimizer || optimizerEnabled),
    },
    remote: {
      type: 'list',
      message: 'Select an endpoint',
      choices: ['etherscan', 'etherchain'],
      default: 'etherscan',
      when: ({ contractName }) => contractName,
    },
    apiKey: {
      type: 'input',
      message: 'Provide an etherscan API KEY',
      when: ({ remote, contractName }) =>
        contractName && remote === 'etherscan',
    },
  };
}

export default { name, signature, description, register, action };
