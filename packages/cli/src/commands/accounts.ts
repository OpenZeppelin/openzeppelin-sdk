import accounts from '../scripts/accounts';
import { networksList, promptForNetwork, InquirerQuestions } from '../prompts/prompt';
import ConfigManager from '../models/config/ConfigManager';
import Telemetry from '../telemetry';

const name = 'accounts';
const signature: string = name;
const description = 'list the accounts of the selected network';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(options: any): Promise<void> {
  const networkOpts = await promptForNetwork(options, () => getCommandProps());
  const { network } = await ConfigManager.initNetworkConfiguration({ ...options, ...networkOpts });

  await Telemetry.report('accounts', { network }, options.interactive);
  await accounts({ network });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function getCommandProps(): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
  };
}

export default { name, signature, description, register, action };
