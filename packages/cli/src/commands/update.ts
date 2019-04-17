import pickBy from 'lodash.pickby';

import update from '../scripts/update';
import Session from '../models/network/Session';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, argsList, methodsList, initArgsForPrompt, proxiesList, proxyInfo } from '../utils/prompt';

const name: string = 'update';
const signature: string = `${name} [alias-or-address]`;
const description: string = 'update contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to update all contracts in your project.';

const networkProps = {
  ...networksList('list'),
};

const proxiesProps = (network, all, contractReference) => {
  return {
    pickProxyBy: {
      message: 'Which proxies would you like to upgrade?',
      type: 'list',
      choices: [{
        name: 'All proxies',
        value: 'all'
      }, {
        name: 'Let me choose by name or alias',
        value: 'byName'
      }, {
        name: 'Let me choose by address',
        value: 'byAddress'
      }],
      when: () => !contractReference
    },
    proxy: {
      message: 'Choose a proxy',
      type: 'list',
      choices: proxiesList(network),
      when: ({ pickProxyBy }) => !all && pickProxyBy !== 'all',
      normalize: (input) => typeof input !== 'object' ? proxyInfo(parse(input), network) : input
    }
  };
};

const initProps = (contractFullName?: string, initMethod?: string, initArgs?: string[]) => {
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
};

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

  const initParams = promptedProxyInfo.proxyReference && !promptedProxyInfo.all
    ? await promptForInitParams(promptedProxyInfo.contractFullName, options)
    : {};

  const args = pickBy({ all: promptedProxyInfo.all, force, ...parsedContractReference, ...initParams });
  await update({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForNetwork(options: any): Promise<any> {
  const { network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaultOpts = { network: networkInSession };
  const opts = { network: networkInOpts || (!expired ? networkInSession : undefined) };

  return promptIfNeeded({ opts, defaults: defaultOpts, props: networkProps }, interactive);
}

// TODO: move to prompt.ts or other, but dry
async function promptForProxies(contractReference: string, network: string, options: any): Promise<any> {
  const { all, interactive } = options;
  const props = proxiesProps(network, all, contractReference);
  const args = {
    pickProxyBy: (all ? 'all' : undefined),
    proxy: contractReference
  };
  const { pickProxyBy, proxy } = await promptIfNeeded({ args, props }, interactive);

  return {
    ...proxy,
    all:  pickProxyBy  === 'all'
  };
}

// TODO: move to prompt.ts or other, but dry
async function promptForInitParams(contractFullName: string, options: any) {
  const { interactive } = options;
  let { initMethod, initArgs } = parseInit(options, 'initialize');
  const { init: rawInitMethod } = options;
  const opts = { askForInitParams: rawInitMethod, initMethod };
  const initMethodProps = initProps(contractFullName, initMethod);

  // prompt for init method if not provided
  ({ initMethod } = await promptIfNeeded({ opts, props: initMethodProps }, interactive));

  const initArgsKeys = argsList(contractFullName, initMethod.selector)
    .reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no initArgs defined, or the args array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!initArgs || (Array.isArray(initArgs) && initArgs.length < Object.keys(initArgsKeys).length)) {
    const initArgsProps = initProps(contractFullName, initMethod.selector, initArgs);
    const promptedArgs = await promptIfNeeded({ opts: initArgsKeys, props: initArgsProps }, interactive);
    initArgs = [...initArgs, ...Object.values(pickBy(promptedArgs))];
  }

  return { initMethod: initMethod.name, initArgs };
}

// TODO: consider moving this into naming.ts
function parse(contractReference: string) {
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

export default { name, signature, description, register, action };
