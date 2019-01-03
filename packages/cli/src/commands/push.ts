import omit from 'lodash.omit';
import isString from 'lodash.isstring';

import push from '../scripts/push';
import Compiler from '../models/compiler/Compiler';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';

const name: string = 'push';
const signature: string = name;
const description: string = 'deploys your project to the specified <network>';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .description(description)
  .usage('--network <network> [options]')
  .option('--skip-compile', 'skips contract compilation')
  .option('-d, --deploy-dependencies', 'deploys dependencies to the network if there is no existing deployment')
  .option('--reset', 'redeploys all contracts (not only the ones that changed)')
  .option('-f, --force', 'ignores validation errors and deploys contracts')
  .withNetworkOptions()
  .action(action);

async function action(options: any): Promise<void> {
  const {  deployDependencies, force, reset: reupload } = options;
  if (!options.skipCompile) await Compiler.call();
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options);
  await push({ force, deployDependencies, reupload, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function tryAction(externalOptions: any): Promise<void> {
  if (!externalOptions.push) return;
  const options = omit(externalOptions, 'push');
  const network = isString(externalOptions.push) ? externalOptions.push : undefined;
  if (network) options.network = network;
  return action(options);
}

export default { name, signature, description, register, action, tryAction };
