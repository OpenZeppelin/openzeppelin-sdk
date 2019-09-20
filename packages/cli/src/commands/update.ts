import pickBy from 'lodash.pickby';

import push from './push';
import update from '../scripts/update';
import { parseContractReference } from '../utils/contract';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigManager from '../models/config/ConfigManager';
import { UpdatePropsParams, UpdateSelectionParams } from './interfaces';
import {
  promptIfNeeded,
  networksList,
  promptForNetwork,
  proxiesList,
  proxyInfo,
  InquirerQuestions,
} from '../prompts/prompt';
import promptForMethodParams from '../prompts/method-params';
import { ProxyType } from '../scripts/interfaces';

const name = 'upgrade';
const signature = `${name} [alias-or-address]`;
const description =
  'upgrade contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to upgrade all contracts in your project.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .alias('update')
    .usage('[alias-or-address] --network <network> [options]')
    .description(description)
    .option(
      '--init [function]',
      `call function after upgrading contract. If no name is given, 'initialize' will be used`,
    )
    .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
    .option('--all', 'upgrade all contracts in the application')
    .option('--force', 'force creation even if contracts have local modifications')
    .withNetworkOptions()
    .withSkipCompileOption()
    .withNonInteractiveOption()
    .action(action);

async function action(proxyReference: string, options: any): Promise<void> {
  const { force, all, init: rawInitMethod } = options;
  const { network: promptedNetwork } = await promptForNetwork(options, () => getCommandProps());
  const { network, txParams } = await ConfigManager.initNetworkConfiguration({
    ...options,
    network: promptedNetwork,
  });

  if (!(await hasToMigrateProject(network))) process.exit(0);

  const promptedProxyInfo = await promptForProxies(proxyReference, network, options);

  const contractFullName = promptedProxyInfo.all ? null : promptedProxyInfo.contractFullName;
  await push.runActionIfNeeded(contractFullName, network, {
    ...options,
    network: promptedNetwork,
    force: true,
  });

  const parsedContractReference = parseContractReference(promptedProxyInfo.proxyReference);

  const additionalOpts = {
    askForMethodParams: rawInitMethod,
    askForMethodParamsMessage: 'Call a function on the instance after upgrading it?',
  };
  const initMethodParams =
    promptedProxyInfo.proxyReference && !promptedProxyInfo.all
      ? await promptForMethodParams(promptedProxyInfo.contractFullName, options, additionalOpts)
      : {};

  const args = pickBy({
    all: promptedProxyInfo.all,
    force,
    ...parsedContractReference,
    ...initMethodParams,
  });
  await update({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForProxies(proxyReference: string, network: string, options: any): Promise<UpdateSelectionParams> {
  const { all, interactive } = options;
  const pickProxyBy = all ? 'all' : undefined;
  const args = { pickProxyBy, proxy: proxyReference };
  const props = getCommandProps({ proxyReference, network, all });
  const { pickProxyBy: promptedPickProxyBy, proxy: promptedProxy } = await promptIfNeeded({ args, props }, interactive);
  console.log('que prompteo', promptedProxy);

  return {
    ...promptedProxy,
    all: promptedPickProxyBy === 'all',
  };
}

function getCommandProps({ proxyReference, network, all }: UpdatePropsParams = {}): InquirerQuestions {
  return {
    ...networksList('network', 'list'),
    pickProxyBy: {
      message: 'Which instances would you like to upgrade?',
      type: 'list',
      choices: [
        {
          name: 'All instances',
          value: 'all',
        },
        {
          name: 'Choose by name',
          value: 'byName',
        },
        {
          name: 'Choose by address',
          value: 'byAddress',
        },
      ],
      when: () => !proxyReference && proxiesList('byAddress', network, { kind: ProxyType.Upgradeable }).length,
    },
    proxy: {
      message: 'Pick an instance to upgrade',
      type: 'list',
      choices: ({ pickProxyBy }) => proxiesList(pickProxyBy, network, { kind: ProxyType.Upgradeable }),
      when: ({ pickProxyBy }) => !all && pickProxyBy && pickProxyBy !== 'all',
      // normalize: input => (typeof input !== 'object' ? proxyInfo(parseContractReference(input), network) : input),
    },
  };
}

export default { name, signature, description, register, action };
