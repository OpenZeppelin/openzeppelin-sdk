import { pickBy } from 'lodash';
import { Loggy } from '@openzeppelin/upgrades';

import link from './link';
import add from './add';
import push from './push';
import create from '../scripts/create';
import Session from '../models/network/Session';
import { compile } from '../models/compiler/Compiler';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigManager from '../models/config/ConfigManager';
import { promptIfNeeded, networksList, contractsList, methodsList, InquirerQuestions } from '../prompts/prompt';
import promptForMethodParams from '../prompts/method-params';
import { ProxyType, CreateParams } from '../scripts/interfaces';
import Telemetry from '../telemetry';

interface PropsParams {
  contractFullName?: string;
  methodName?: string;
  methodArgs?: string[];
}

const name = 'create';
const signature = `${name} [alias]`;
const description =
  'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias] --network <network> [options]')
    .description(description)
    .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
    .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
    .option('--force', 'ignore contracts validation errors')
    .option('--minimal', 'creates a cheaper but non-upgradeable instance instead, using a minimal proxy')
    .withNetworkOptions()
    .withSkipCompileOption()
    .withNonInteractiveOption()
    .action(createAction);

export async function createAction(contractFullName: string, options: any): Promise<void> {
  if (options.minimal) {
    Loggy.noSpin.warn(__filename, 'action', 'create-minimal-proxy', 'Minimal proxy support is still experimental.');
  }

  const { skipCompile } = options;
  if (!skipCompile) await compile();

  const { network: promptedNetwork, contractFullName: promptedContractFullName } = await promptForCreate(
    contractFullName,
    options,
  );
  const { network, txParams } = await ConfigManager.initNetworkConfiguration({
    ...options,
    network: promptedNetwork,
  });

  await link.runActionIfNeeded(promptedContractFullName, options);
  await add.runActionIfNeeded(promptedContractFullName, options);
  await push.runActionIfNeeded(promptedContractFullName, network, {
    ...options,
    network: promptedNetwork,
  });

  await action(promptedContractFullName, { ...options, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function action(contractFullName: string, options: any): Promise<void> {
  const { force, network, txParams, init: rawInitMethod } = options;
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);

  const additionalOpts = {
    askForMethodParams: rawInitMethod,
    askForMethodParamsMessage: 'Call a function to initialize the instance after creating it?',
  };
  const { methodName, methodArgs } = await promptForMethodParams(contractFullName, options, additionalOpts);

  const args = pickBy({
    packageName,
    contractAlias,
    methodName,
    methodArgs,
    force,
  } as CreateParams);

  if (options.minimal) args.kind = ProxyType.Minimal;

  if (!(await hasToMigrateProject(network))) process.exit(0);

  await Telemetry.report('create', { ...args, network, txParams }, options.interactive);
  await create({ ...args, network, txParams });
  Session.setDefaultNetworkIfNeeded(network);
}

async function promptForCreate(contractFullName: string, options: any): Promise<any> {
  const { force, network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaultOpts = { network: networkInSession };
  const args = { contractFullName };
  const opts = {
    network: networkInOpts || (!expired ? networkInSession : undefined),
  };

  return promptIfNeeded({ args, opts, defaults: defaultOpts, props: getCommandProps() }, interactive);
}

function getCommandProps(): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    ...contractsList('contractFullName', 'Pick a contract to instantiate', 'list', 'all'),
  };
}

export default { name, signature, description, register, action };
