import pickBy from 'lodash.pickby';

import init from './init';
import add from './add';
import push from './push';
import create from '../scripts/create';
import Session from '../models/network/Session';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, contractsList, methodsList, argsList } from '../utils/prompt';

const name: string = 'create';
const signature: string = `${name} [alias]`;
const description: string = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(actionsWrapper);

async function actionsWrapper(contractFullName: string, options: any) {
  await init.runActionIfNeeded(options);

  const { network: promptedNewtork, contractFullName: promptedContractFullName } = await promptForCreate(contractFullName, options);
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, network: promptedNewtork });

  await add.runActionIfNeeded(promptedContractFullName, options);
  await push.runActionIfNeeded(promptedContractFullName, network, { ...options, network: promptedNewtork });

  const initParams = await promptForInitParams(promptedContractFullName, options);

  await action(promptedContractFullName, { ...options, ...initParams, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function action(contractFullName: string, options: any) {
  const { force, initMethod, initArgs, network, txParams } = options;
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const args = pickBy({ packageName, contractAlias, initMethod, initArgs, force });

  if (!await hasToMigrateProject(network)) process.exit(0);

  await create({ ...args, network, txParams });
  Session.setDefaultNetworkIfNeeded(network);
}

async function promptForCreate(contractFullName: string, options: any): Promise<any> {
  const { force, network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaultOpts = { network: networkInSession };
  const args = { contractFullName };
  const opts = { network: networkInOpts || (!expired ? networkInSession : undefined) };

  return promptIfNeeded({ args, opts, defaults: defaultOpts, props: setCommandProps() }, interactive);
}

// TODO: move to prompt.ts
async function promptForInitParams(contractFullName: string, options: any) {
  const { interactive } = options;
  let { initMethod, initArgs } = parseInit(options, 'initialize');
  const { init: rawInitMethod } = options;
  const opts = { askForInitParams: rawInitMethod, initMethod };
  const initMethodProps = setCommandProps(contractFullName, initMethod);

  // prompt for init method if not provided
  ({ initMethod } = await promptIfNeeded({ opts, props: initMethodProps }, interactive));

  const initArgsKeys = argsList(contractFullName, initMethod.selector)
    .reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no initArgs defined, or the args array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!initArgs || (Array.isArray(initArgs) && initArgs.length < Object.keys(initArgsKeys).length)) {
    const initArgsProps = setCommandProps(contractFullName, initMethod.selector, initArgs);
    const promptedArgs = await promptIfNeeded({ opts: initArgsKeys, props: initArgsProps }, interactive);
    initArgs = [...initArgs, ...Object.values(pickBy(promptedArgs))];
  }

  return { initMethod: initMethod.name, initArgs };
}

function setCommandProps(contractFullName?: string, initMethod?: string, initArgs?: string[])  {
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
    ...networksList('list'),
    ...contractsList('contractFullName', 'Choose a contract', 'list', 'all'),
    askForInitParams: {
      type: 'confirm',
      message: 'Do you want to run a function after creating the instance?',
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

export default { name, signature, description, register, action: actionsWrapper };
