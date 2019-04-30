import balance from '../scripts/balance';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'balance';
const signature: string = `${name} [address]`;
const description: string = 'query the balance of the specified account';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--erc20 <contractAddress>', 'specify an ERC20 token address')
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(accountAddress: string, options: any): Promise<void> {
  const { network: networkInOpts, erc20: contractAddress, interactive } = options;
  const args = { accountAddress };
  const opts = { network: networkInOpts };
  const props = getCommandProps();
  const promptedConfig = await promptIfNeeded({ args, opts, props }, interactive);

  await ConfigVariablesInitializer.initNetworkConfiguration(promptedConfig);
  await balance({ accountAddress: promptedConfig.accountAddress, contractAddress });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function getCommandProps(): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    accountAddress: {
      type: 'input',
      message: 'Enter an account address',
    },
  };
}
export default { name, signature, description, register, action };
