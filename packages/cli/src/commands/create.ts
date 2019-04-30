import pickBy from 'lodash.pickby';

import link from './link';
import add from './add';
import push from './push';
import create from '../scripts/create';
import Session from '../models/network/Session';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, contractsList, methodsList, argsList } from '../prompts/prompt';
import promptForInitParams from '../prompts/init-params';

interface PropsParams {
  contractFullName?: string;
  initMethod?: string;
  initArgs?: string[];
}

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
  .action(commandActions);

async function commandActions(contractFullName: string, options: any) {
  const { network: promptedNewtork, contractFullName: promptedContractFullName } = await promptForCreate(contractFullName, options);
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, network: promptedNewtork });

  await link.runActionIfNeeded(promptedContractFullName, options);
  await add.runActionIfNeeded(promptedContractFullName, options);
  await push.runActionIfNeeded(promptedContractFullName, network, { ...options, network: promptedNewtork });

  const initParams = await promptForInitParams(promptedContractFullName,getCommandProps, options);

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

  return promptIfNeeded({ args, opts, defaults: defaultOpts, props: getCommandProps() }, interactive);
}

function getCommandProps({ contractFullName, initMethod, initArgs }: PropsParams = {})  {
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

export default { name, signature, description, register, action };
