import publish from '../scripts/publish';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ZosPackageFile from '../models/files/ZosPackageFile';

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
  const zosversion = await ZosPackageFile.getZosversion();
  if (!await hasToMigrateProject(zosversion)) return;
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  await publish({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
