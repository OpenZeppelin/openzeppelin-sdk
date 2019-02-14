import publish from '../scripts/publish';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ZosNetworkFile from '../models/files/ZosNetworkFile';

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
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  const zosversion = await ZosNetworkFile.getZosversion(network);
  if (!await hasToMigrateProject(zosversion)) process.exit(0);

  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
