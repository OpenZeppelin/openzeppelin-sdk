import pickBy from 'lodash.pickby';

import link from './link';
import add from './add';
import push from './push';
import create from '../scripts/create';
import Session from '../models/network/Session';
import Compiler from '../models/compiler/Compiler';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigVariablesInitializer from '../models/config/ConfigManager';
import { promptIfNeeded, networksList, contractsList, methodsList, argsList } from '../prompts/prompt';
import promptForMethodParams from '../prompts/method-params';
import { ProxyType } from '../scripts/interfaces';

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
    .option(
      '--init [function]',
      `call function after creating contract. If none is given, 'initialize' will be used`,
    )
    .option(
      '--args <arg1, arg2, ...>',
      'provide initialization arguments for your contract if required',
    )
    .option(
      '--force',
      'force creation even if contracts have local modifications',
    )
    .option(
      '--minimal',
      'creates a cheaper but non-upgradeable instance instead, using a minimal proxy',
    )
    .withNetworkOptions()
    .withSkipCompileOption()
    .withNonInteractiveOption()
    .action(commandActions);

async function commandActions(contractFullName: string, options: any) {
  const { skipCompile } = options;
  if (!skipCompile) await Compiler.call();

  const {
    network: promptedNewtork,
    contractFullName: promptedContractFullName,
  } = await promptForCreate(contractFullName, options);
  const {
    network,
    txParams,
  } = await ConfigVariablesInitializer.initNetworkConfiguration({
    ...options,
    network: promptedNewtork,
  });

  await link.runActionIfNeeded(promptedContractFullName, options);
  await add.runActionIfNeeded(promptedContractFullName, options);
  await push.runActionIfNeeded(promptedContractFullName, network, {
    ...options,
    network: promptedNewtork,
    force: true,
  });

  await action(promptedContractFullName, { ...options, network, txParams });
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

async function action(contractFullName: string, options: any) {
  const { force, network, txParams, init: rawInitMethod } = options;
  const {
    contract: contractAlias,
    package: packageName,
  } = fromContractFullName(contractFullName);

  const additionalOpts = { askForMethodParams: rawInitMethod };
  const { methodName, methodArgs } = await promptForMethodParams(
    contractFullName,
    getCommandProps,
    options,
    additionalOpts,
  );

  const args = pickBy({
    packageName,
    contractAlias,
    methodName,
    methodArgs,
    force,
  });
  if (options.minimal) args.kind = ProxyType.Minimal;

  if (!(await hasToMigrateProject(network))) process.exit(0);

  await create({ ...args, network, txParams });
  Session.setDefaultNetworkIfNeeded(network);
}

async function promptForCreate(
  contractFullName: string,
  options: any,
): Promise<any> {
  const { force, network: networkInOpts, interactive } = options;
  const { network: networkInSession, expired } = Session.getNetwork();
  const defaultOpts = { network: networkInSession };
  const args = { contractFullName };
  const opts = {
    network: networkInOpts || (!expired ? networkInSession : undefined),
  };

  return promptIfNeeded(
    { args, opts, defaults: defaultOpts, props: getCommandProps() },
    interactive,
  );
}

function getCommandProps({
  contractFullName,
  methodName,
  methodArgs,
}: PropsParams = {}) {
  const initMethodsList = methodsList(contractFullName);
  const initMethodArgsList = argsList(contractFullName, methodName).reduce(
    (accum, argName, index) => {
      return {
        ...accum,
        [argName]: {
          message: `${argName}:`,
          type: 'input',
          when: () => !methodArgs || !methodArgs[index],
        },
      };
    },
    {},
  );

  return {
    ...networksList('network', 'list'),
    ...contractsList('contractFullName', 'Choose a contract', 'list', 'all'),
    askForMethodParams: {
      type: 'confirm',
      message: 'Do you want to run a function after creating the instance?',
      when: () => initMethodsList.length !== 0 && methodName !== 'initialize',
    },
    methodName: {
      type: 'list',
      message: 'Select a method',
      choices: initMethodsList,
      when: ({ askForMethodParams }) => askForMethodParams,
      normalize: input => {
        if (typeof input !== 'object') {
          return { name: input, selector: input };
        } else return input;
      },
    },
    ...initMethodArgsList,
  };
}

export default { name, signature, description, register, action };
