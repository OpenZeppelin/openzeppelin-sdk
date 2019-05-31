import pull from '../scripts/pull';
import status from '../scripts/status';
import compare from '../scripts/compare';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name = 'status';
const signature: string = name;
const description =
  'print information about the local status of your app in a specific network';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .usage('--network <network>')
    .option(
      '--fetch',
      'retrieve app information directly from the network instead of from the local network file',
    )
    .option(
      '--fix',
      'update local network file with information retrieved from the network',
    )
    .withNetworkOptions()
    .action(action);

async function action(options: any): Promise<void> {
  const {
    network,
    txParams,
  } = await ConfigVariablesInitializer.initNetworkConfiguration(options);

  if (options.fix) await pull({ network, txParams });
  else if (options.fetch) await compare({ network, txParams });
  else await status({ network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

export default { name, signature, description, register, action };
