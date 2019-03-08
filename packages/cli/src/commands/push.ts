import omit from 'lodash.omit';
import isString from 'lodash.isstring';
import { ZWeb3 } from 'zos-lib';

import push from '../scripts/push';
import Session from '../models/network/Session';
import Compiler from '../models/compiler/Compiler';
import Dependency from '../models/dependency/Dependency';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, getNetworkList } from '../utils/prompt';

const name: string = 'push';
const signature: string = name;
const description: string = 'deploys your project to the specified <network>';

const props = (networkName?: string) => {
  return {
    ...getNetworkList('list'),
    deployDependencies: {
      type: 'confirm',
      message: `One or more linked dependencies are not yet deployed on ${networkName}.\nDo you want to deploy them now?`,
      default: true
    }
  };
};

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
  const { force, deployDependencies, reset: reupload, network: networkInArgs } = options;
  const { network: networkInSession } = Session.getOptions();
  const defaultArgs = { network: Session.getDefaultNetwork() };
  const defaultOpts = { network: networkInSession || networkInArgs };
  if (!options.skipCompile) await Compiler.call();

  const promptedOpts = await promptIfNeeded({ opts: defaultOpts, defaults: defaultArgs, props: props() });
  Session.setDefaultNetworkIfNeeded(promptedOpts.network);

  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(promptedOpts);
  const promptDeployDependencies = await promptForDeployDependencies(deployDependencies, network);

  await push({ force, reupload, network, txParams, ...promptDeployDependencies });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function tryAction(externalOptions: any): Promise<void> {
  if (!externalOptions.push) return;
  const options = omit(externalOptions, 'push');
  const network = isString(externalOptions.push) ? externalOptions.push : undefined;
  if (network) options.network = network;
  return action(options);
}

async function promptForDeployDependencies(deployDependencies, network): Promise<{ deployDependencies: boolean }> {
  if (await ZWeb3.isGanacheNode()) return { deployDependencies: true };
  if (Dependency.hasDependenciesForDeploy(network)) {
    return promptIfNeeded({ opts: { deployDependencies }, props: props(network) });
  }
  return { deployDependencies: undefined };
}

export default { name, signature, description, register, action, tryAction };
