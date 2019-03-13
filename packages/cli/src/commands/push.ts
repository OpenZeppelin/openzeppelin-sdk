import omit from 'lodash.omit';
import isString from 'lodash.isstring';
import { ZWeb3 } from 'zos-lib';

import push from '../scripts/push';
import Session from '../models/network/Session';
import Compiler from '../models/compiler/Compiler';
import Dependency from '../models/dependency/Dependency';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList } from '../utils/prompt';

const name: string = 'push';
const signature: string = name;
const description: string = 'deploys your project to the specified <network>';

const props = (networkName?: string) => {
  return {
    ...networksList('list'),
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
  .option('--deploy-proxy-admin', 'eagerly deploys the project\'s proxy admin (if not deployed yet on the provided network)')
  .option('--deploy-proxy-factory', 'eagerly deploys the project\'s proxy factory (if not deployed yet on the provided network)')
  .withNetworkOptions()
  .action(action);

async function action(options: any): Promise<void> {
  const { force, deployDependencies, reset: reupload, network: networkInOpts, deployProxyAdmin, deployProxyFactory } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaults = { network: networkInSession };
  const opts = { network: networkInOpts || !expired ? networkInSession : undefined };

  if (!options.skipCompile) await Compiler.call();

  const promptedOpts = await promptIfNeeded({ opts, defaults, props: props() });
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...promptedOpts, ...options });
  const promptDeployDependencies = await promptForDeployDependencies(deployDependencies, network);

  await push({ deployProxyAdmin, deployProxyFactory, force, reupload, network, txParams, ...promptDeployDependencies });
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
