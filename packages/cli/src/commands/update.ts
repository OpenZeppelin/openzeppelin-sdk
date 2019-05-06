import pickBy from 'lodash.pickby';

import update from '../scripts/update';
import { parseContractReference } from '../utils/contract';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { UpdatePropsParams, UpdateSelectionParams } from './interfaces';
import {
  promptIfNeeded,
  networksList,
  promptForNetwork,
  argsList,
  methodsList,
  proxiesList,
  proxyInfo,
  InquirerQuestions
} from '../prompts/prompt';
import promptForInitParams from '../prompts/init-params';

const name: string = 'update';
const signature: string = `${name} [alias-or-address]`;
const description: string = 'update contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to update all contracts in your project.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias-or-address] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after upgrading contract. If no name is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--all', 'update all contracts in the application')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(contractReference: string, options: any): Promise<void> {
  const { force, interactive, all } = options;
  const networkOpts = await promptForNetwork(options, () => getCommandProps());
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, ...networkOpts });
  if (!await hasToMigrateProject(network)) process.exit(0);

  const promptedProxyInfo = await promptForProxies(contractReference, network, options);
  const parsedContractReference = parseContractReference(promptedProxyInfo.proxyReference);

  const promptedInitParams = promptedProxyInfo.proxyReference && !promptedProxyInfo.all
    ? await promptForInitParams(promptedProxyInfo.contractFullName, getCommandProps, options)
    : {};

  const args = pickBy({ all: promptedProxyInfo.all, force, ...parsedContractReference, ...promptedInitParams });
  await update({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForProxies(contractReference: string, network: string, options: any): Promise<UpdateSelectionParams> {
  const { all, interactive } = options;
  const pickProxyBy = all ? 'all' : undefined;
  const args = { pickProxyBy, proxy: contractReference };
  const props = getCommandProps({ contractReference, network, all });
  const { pickProxyBy: promptedPickProxyBy, proxy: promptedProxy } = await promptIfNeeded({ args, props }, interactive);

  return {
    ...promptedProxy,
    all: promptedPickProxyBy  === 'all'
  };
}

function getCommandProps({ contractReference, network, all, contractFullName, initMethod, initArgs }: UpdatePropsParams = {}): InquirerQuestions {
  const initMethodsList = methodsList(contractFullName);
  const initArgsList = argsList(contractFullName, initMethod)
    .reduce((accum, argName, index) => {
      return {
        ...accum,
        [argName]: {
          message: `${argName}:`,
          type: 'input',
          when: () => !initArgs || !initArgs[index]
        }
      };
    }, {});

  return {
    ...networksList('network', 'list'),
    pickProxyBy: {
      message: 'Which proxies would you like to upgrade?',
      type: 'list',
      choices: [{
        name: 'All proxies',
        value: 'all'
      }, {
        name: 'Choose by name',
        value: 'byName'
      }, {
        name: 'Choose by address',
        value: 'byAddress'
      }],
      when: () => !contractReference && proxiesList('byAddress', network).length,
    },
    proxy: {
      message: 'Choose a proxy',
      type: 'list',
      choices: ({ pickProxyBy }) => proxiesList(pickProxyBy, network),
      when: ({ pickProxyBy }) => !all && pickProxyBy && pickProxyBy !== 'all',
      normalize: (input) => typeof input !== 'object' ? proxyInfo(parseContractReference(input), network) : input
    },
    askForInitParams: {
      type: 'confirm',
      message: 'Do you want to run a function after updating the instance?',
      when: () => initMethodsList.length !== 0 && initMethod !== 'initialize'
    },
    initMethod: {
      type: 'list',
      message: 'Select a method',
      choices: initMethodsList,
      when: (({ askForInitParams }) => askForInitParams),
      normalize: (input) => {
        if (typeof input !== 'object') {
          return { name: input, selector: input };
        } else return input;
      }
    },
    ...initArgsList
  };
}

export default { name, signature, description, register, action };
