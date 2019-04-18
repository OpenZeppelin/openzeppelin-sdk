import publish from '../scripts/publish';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { hasToMigrateProject } from '../utils/prompt-migration';
import { promptIfNeeded, networksList, InquirerQuestions } from '../utils/prompt';
import Session from '../models/network/Session';

const name: string = 'publish';
const signature: string = `${name}`;
const description: string = 'publishes your project to the selected network';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInArgs } = options;
  const { network: networkInSession } = Session.getOptions();
  const defaults = { network: Session.getNetwork() };
  const opts = { network: networkInSession || networkInArgs };
  const props = setCommandProps();

  const promptedOpts = await promptIfNeeded({ opts, defaults, props });
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedOpts);
  if (!await hasToMigrateProject(network)) process.exit(0);

  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function setCommandProps(): InquirerQuestions {
  return networksList('list');
}

export default { name, signature, description, register, action };
