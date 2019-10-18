import publish from '../scripts/publish';
import ConfigManager from '../models/config/ConfigManager';
import { hasToMigrateProject } from '../prompts/migrations';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import Session from '../models/network/Session';
import Telemetry from '../telemetry';

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

  const promptedOpts = await promptIfNeeded({ opts, defaults, props }, interactive);
  const { network, txParams } = await ConfigManager.initNetworkConfiguration(promptedOpts);
  if (!(await hasToMigrateProject(network))) process.exit(0);

  await Telemetry.report('publish', { network, txParams }, interactive);
  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

function getCommandProps(): InquirerQuestions {
  return networksList('network', 'list');
}

export default { name, signature, description, register, action };
