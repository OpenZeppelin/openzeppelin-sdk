import pickBy from 'lodash.pickby';

import create from '../scripts/create';
import Session from '../models/network/Session';
import { parseInit } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../utils/prompt-migration';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, contractsList, methodsList, argsList, initArgsForPrompt } from '../utils/prompt';

const name: string = 'create';
const signature: string = `${name} [alias]`;
const description: string = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.';

const baseProps = {
  ...networksList('list'),
  ...contractsList('contractFullName', 'Choose a contract', 'list'),
};

const initProps = (contractFullName?: string, initMethod?: string) => {
  const args = initMethod ? argsList(contractFullName, initMethod) : {};
  return {
    ...methodsList(contractFullName),
    ...args
  };
};

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[alias] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action);

async function action(contractFullName: string, options: any): Promise<void> {
  const { force } = options;
  const createParams = await promptForCreate(contractFullName, options);
  if (!await hasToMigrateProject(createParams.network)) process.exit(0);

  // get network and prompt for initialize method and arguments
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, ...createParams });
  const initParams = await promptForInitParams(createParams.contractFullName, options);
  const { contract: contractAlias, package: packageName } = fromContractFullName(createParams.contractFullName);
  const args = pickBy({ packageName, contractAlias, ...initParams, force });

  await create({ ...args, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForCreate(contractFullName: string, options: any): Promise<any> {
  const { force, network: networkInOpts } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaults = { network: networkInSession };
  const opts = { network: networkInOpts || !expired ? networkInSession : undefined };

  return promptIfNeeded({ args: { contractFullName }, opts, defaults, props: baseProps });
}

async function promptForInitParams(contractFullName: string, options: any) {
  const { init: rawInitMethod, args: rawInitArgs } = options;
  const initMethodOpts = { initMethod: rawInitMethod };
  const initMethodProps = initProps(contractFullName);
  let { initArgs, initMethod } = parseInit(options);

  // prompt for init method init method
  const promptedMethod = await promptIfNeeded({ opts: initMethodOpts, props: initMethodProps });
  initMethod = promptedMethod.initMethod
    ? promptedMethod.initMethod
    : { selector: initMethod, name: initMethod };

  // if no initial arguments are provided, prompt for them
  if (!rawInitArgs) {
    const initArgsKeys = initArgsForPrompt(contractFullName, initMethod.selector);
    const initArgsProps = initProps(contractFullName, initMethod.selector);
    const promptedArgs = await promptIfNeeded({ opts: initArgsKeys, props: initArgsProps });
    initArgs = Object.values(promptedArgs);
  }

  return { initMethod: initMethod.name, initArgs };
}

export default { name, signature, description, register, action };
