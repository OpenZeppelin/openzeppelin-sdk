import freeze from '../scripts/freeze';
import ConfigManager from '../models/config/ConfigManager';
import Telemetry from '../telemetry';

const name = 'freeze';
const signature: string = name;
const description = 'freeze current release version of your published project';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .withNetworkOptions()
    .action(action);

async function action(options: any): Promise<void> {
  const { network, txParams } = await ConfigManager.initNetworkConfiguration(options);
  await Telemetry.report('freeze', { network, txParams }, options.interactive);
  await freeze({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };
