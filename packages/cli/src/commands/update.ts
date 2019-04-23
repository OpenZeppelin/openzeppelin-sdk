import pickBy from 'lodash.pickby';

import update from '../scripts/update';
import Session from '../models/network/Session';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, argsList, methodsList, proxiesList, proxyInfo, InquirerQuestions } from '../utils/prompt';

interface PropsParams {
  contractReference?: string;
  network?: string;
  all?: boolean;
  contractFullName?: string;
  initMethod?: string;
  initArgs?: string[];
}

interface ParsedContractReference {
  proxyAddress: string | undefined;
  contractAlias: string | undefined;
  packageName: string | undefined;
}

interface ProxyInterface {
  address: string | undefined;
  contractFullName: string | undefined;
  proxyReference: string | undefined;
  all: boolean;
}

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
  const networkOpts = await promptForNetwork(options);
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, ...networkOpts });
  if (!await hasToMigrateProject(network)) process.exit(0);

  const promptedProxyInfo = await promptForProxies(contractReference, network, options);
  const parsedContractReference = parse(promptedProxyInfo.proxyReference);

  const promptedInitParams = promptedProxyInfo.proxyReference && !promptedProxyInfo.all
    ? await promptForInitParams(promptedProxyInfo.contractFullName, options)
    : {};

  const args = pickBy({ all: promptedProxyInfo.all, force, ...parsedContractReference, ...promptedInitParams });
  await update({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForNetwork(options: any): Promise<{ network: string }> {
  const { network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaults = { network: networkInSession };
  const opts = { network: networkInOpts || (!expired ? networkInSession : undefined) };
  const props = setCommandProps();

  return promptIfNeeded({ opts, defaults, props }, interactive);
}

async function promptForProxies(contractReference: string, network: string, options: any): Promise<ProxyInterface> {
  const { all, interactive } = options;
  const pickProxyBy = all ? 'all' : undefined;
  const args = { pickProxyBy, proxy: contractReference };
  const props = setCommandProps({ contractReference, network, all });
  const { pickProxyBy: promptedPickProxyBy, proxy: promptedProxy } = await promptIfNeeded({ args, props }, interactive);

  const foo = {
    ...promptedProxy,
    all:  promptedPickProxyBy  === 'all'
  };

  return foo;
}

// TODO: move to prompt.ts or other, but dry
async function promptForInitParams(contractFullName: string, options: any): Promise<{ initMethod: string, initArgs: string[] }> {
  const { interactive } = options;
  let { initMethod, initArgs } = parseInit(options, 'initialize');
  const { init: rawInitMethod } = options;
  const opts = { askForInitParams: rawInitMethod, initMethod };
  const initMethodProps = setCommandProps({ contractFullName, initMethod });

  // prompt for init method if not provided
  ({ initMethod } = await promptIfNeeded({ opts, props: initMethodProps }, interactive));

  const initArgsKeys = argsList(contractFullName, initMethod.selector)
    .reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no initArgs defined, or the initArgs array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!initArgs || initArgs.length < Object.keys(initArgsKeys).length) {
    const initArgsProps = setCommandProps({ contractFullName, initMethod: initMethod.selector, initArgs });
    const promptedArgs = await promptIfNeeded({ opts: initArgsKeys, props: initArgsProps }, interactive);
    initArgs = [...initArgs, ...Object.values(pickBy(promptedArgs))];
  }

  return { initMethod: initMethod.name, initArgs };
}

function parse(contractReference: string): ParsedContractReference {
  let proxyAddress;
  let contractAlias;
  let packageName;

  if (contractReference && contractReference.startsWith('0x')) {
    proxyAddress = contractReference;
  } else if (contractReference) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractReference));
  }

  return { proxyAddress, contractAlias, packageName };
}

function setCommandProps({ contractReference, network, all, contractFullName, initMethod, initArgs }: PropsParams = {}): InquirerQuestions {
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
    ...networksList('network', 'Select a network from the network list', 'list'),
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
      normalize: (input) => typeof input !== 'object' ? proxyInfo(parse(input), network) : input
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
