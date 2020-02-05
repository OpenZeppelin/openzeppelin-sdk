import { omit, isString } from 'lodash';
import { ZWeb3 } from '@openzeppelin/upgrades';

import add from './add';
import push from '../scripts/push';
import Session from '../models/network/Session';
import { compile } from '../models/compiler/Compiler';
import Dependency from '../models/dependency/Dependency';
import ConfigManager from '../models/config/ConfigManager';
import { promptIfNeeded, networksList, InquirerQuestions } from '../prompts/prompt';
import Telemetry from '../telemetry';

const name = 'push';
const signature: string = name;
const description = 'deploys your project to the specified <network>';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .usage('--network <network> [options]')
    .option('--skip-compile', 'skips contract compilation')
    .option('-d, --deploy-dependencies', 'deploys dependencies to the network if there is no existing deployment')
    .option('--reset', 'redeploys all contracts (not only the ones that changed)')
    .option('--force', 'ignores validation errors and deploys contracts')
    .option(
      '--deploy-proxy-admin',
      "eagerly deploys the project's proxy admin (if not deployed yet on the provided network)",
    )
    .option(
      '--deploy-proxy-factory',
      "eagerly deploys the project's proxy factory (if not deployed yet on the provided network)",
    )
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(commandActions);

async function commandActions(options: any): Promise<void> {
  await add.runActionIfNeeded(null, options);
  await action(options);
}

async function action(options: any): Promise<void> {
  const {
    force,
    deployDependencies,
    reset: reupload,
    network: networkInOpts,
    deployProxyAdmin,
    deployProxyFactory,
    interactive,
  } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const opts = {
    network: networkInOpts || (!expired ? networkInSession : undefined),
  };
  const defaults = { network: networkInSession };
  const props = getCommandProps();

  if (!options.skipCompile) await compile();

  const prompted = await promptIfNeeded({ opts, defaults, props }, interactive);
  const { network, txParams } = await ConfigManager.initNetworkConfiguration({
    ...options,
    ...prompted,
  });
  const promptDeployDependencies = await promptForDeployDependencies(deployDependencies, network, interactive);

  const pushArguments = {
    deployProxyAdmin,
    deployProxyFactory,
    force,
    reupload,
    network,
    txParams,
    ...promptDeployDependencies,
  };

  if (!options.skipTelemetry) await Telemetry.report('push', pushArguments, interactive);
  await push(pushArguments);
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function runActionIfRequested(externalOptions: any): Promise<void> {
  if (!externalOptions.push) return;
  const options = omit(externalOptions, 'push');
  const network = isString(externalOptions.push) ? externalOptions.push : undefined;
  if (network) options.network = network;
  return action(options);
}

async function runActionIfNeeded(contractName: string, network: string, options: any): Promise<void> {
  if (!options.interactive) return;
  await action({ ...options, dontExitProcess: true, skipTelemetry: true });
}

async function promptForDeployDependencies(
  deployDependencies: boolean,
  network: string,
  interactive: boolean,
): Promise<{ deployDependencies: boolean | undefined }> {
  if (await ZWeb3.isGanacheNode()) return { deployDependencies: true };
  if (Dependency.hasDependenciesForDeploy(network)) {
    const opts = { deployDependencies };
    const props = getCommandProps(network);
    return promptIfNeeded({ opts, props }, interactive);
  }
  return { deployDependencies: undefined };
}

function getCommandProps(networkName?: string): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    deployDependencies: {
      type: 'confirm',
      message: `One or more linked dependencies are not yet deployed on ${networkName}.\nDo you want to deploy them now?`,
      default: true,
    },
  };
}

export default {
  name,
  signature,
  description,
  register,
  action,
  runActionIfRequested,
  runActionIfNeeded,
};
