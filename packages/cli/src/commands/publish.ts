import publish from '../scripts/publish';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { hasToMigrateProject } from '../utils/prompt-migration';
import { promptIfNeeded, networksList } from '../utils/prompt';
import Session from '../models/network/Session';

const baseProps = {
  ...networksList('list'),
};

const name: string = 'publish';
const signature: string = `${name}`;
const description: string = 'publishes your project to the selected network';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .withNetworkOptions()
  .action(action);

async function action(options: any): Promise<void> {
  const { network: networkInArgs } = options;
  const { network: networkInSession } = Session.getOptions();
  const defaultArgs = { network: Session.getNetwork() };
  const defaultOpts = { network: networkInSession || networkInArgs };

  const promptedOpts = await promptIfNeeded({ opts: defaultOpts, defaults: defaultArgs, props: baseProps });
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedOpts);
  if (!await hasToMigrateProject(network)) process.exit(0);

  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
