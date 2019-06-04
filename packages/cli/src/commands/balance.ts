import balance from '../scripts/balance';
import {
  promptIfNeeded,
  networksList,
  InquirerQuestions,
} from '../prompts/prompt';
import ConfigManager from '../models/config/ConfigManager';
import Session from '../models/network/Session';

const name = 'balance';
const signature = `${name} [address]`;
const description = 'query the balance of the specified account';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .option(
      '--erc20 <contractAddress>',
      'query the balance of an ERC20 token instead of ETH',
    )
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(accountAddress: string, options: any): Promise<void> {
  const {
    network: networkInOpts,
    erc20: contractAddress,
    interactive,
  } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const opts = {
    network: networkInOpts || (!expired ? networkInSession : undefined),
  };
  const args = { accountAddress };
  const props = getCommandProps();
  const defaults = { network: networkInSession };
  const promptedConfig = await promptIfNeeded(
    { args, opts, props, defaults },
    interactive,
  );

  await ConfigManager.initNetworkConfiguration({
    ...options,
    ...promptedConfig,
  });
  await balance({
    accountAddress: promptedConfig.accountAddress,
    contractAddress,
  });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

function getCommandProps(): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    accountAddress: {
      type: 'input',
      message: 'Enter an address to query its balance',
    },
  };
}
export default { name, signature, description, register, action };
