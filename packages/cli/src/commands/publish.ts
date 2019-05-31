import publish from '../scripts/publish';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { hasToMigrateProject } from '../prompts/migrations';
import {
  promptIfNeeded,
  networksList,
  InquirerQuestions,
} from '../prompts/prompt';
import Session from '../models/network/Session';

const name = 'publish';
const signature = `${name}`;
const description = 'publishes your project to the selected network';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInArgs, interactive } = options;
  const { network: networkInSession } = Session.getOptions();
  const defaults = { network: Session.getNetwork() };
  const opts = { network: networkInSession || networkInArgs };
  const props = getCommandProps();

  const promptedOpts = await promptIfNeeded(
    { opts, defaults, props },
    interactive,
  );
  const {
    network,
    txParams,
  } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedOpts);
  if (!(await hasToMigrateProject(network))) process.exit(0);

  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

function getCommandProps(): InquirerQuestions {
  return networksList('network', 'list');
}

export default { name, signature, description, register, action };
