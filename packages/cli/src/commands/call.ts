import pickBy from 'lodash.pickby';
import { ContractMethodMutability as Mutability } from 'zos-lib';

import call from '../scripts/call';
import { parseContractReference } from '../utils/contract';
import {
  promptIfNeeded,
  networksList,
  promptForNetwork,
  argsList,
  methodsList,
  proxiesList,
  proxyInfo,
  InquirerQuestions,
} from '../prompts/prompt';
import ConfigManager from '../models/config/ConfigManager';
import { SendTxPropsParams, SendTxSelectionParams } from './interfaces';
import promptForMethodParams from '../prompts/method-params';

const name = 'call';
const signature: string = name;
const description =
  'call a method of the specified contract instance. Provide the [address], method to call and its arguments if needed';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('--to <to> --method <method> [options]')
    .description(description)
    .option('--to <to>', 'address of the contract that will receive the call')
    .option(
      '--method <method>',
      `name of the method to execute in the contract`,
    )
    .option('--args <arg1, arg2, ...>', 'arguments to the method to execute')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);

async function action(options: any): Promise<void> {
  const { interactive, to: proxyAddress } = options;
  const networkOpts = await promptForNetwork(options, () => getCommandProps());
<<<<<<< HEAD
  const {
    network,
    txParams,
  } = await ConfigVariablesInitializer.initNetworkConfiguration({
    ...options,
    ...networkOpts,
  });

  const { contractFullName, proxyReference } = await promptForProxy(
    proxyAddress,
    network,
    options,
  );
  const methodParams = await promptForMethodParams(
    contractFullName,
    getCommandProps,
    options,
    {},
    Mutability.Constant,
  );
  const args = pickBy({ ...methodParams, proxyAddress: proxyReference });
  await call({ ...args, network, txParams });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
    process.exit(0);
}

async function promptForProxy(
  proxyAddress: string,
  network: string,
  options: any,
): Promise<SendTxSelectionParams> {
  const { interactive } = options;
  const opts = { proxy: proxyAddress };
  const props = getCommandProps({ network });
  const { proxy: promptedProxy } = await promptIfNeeded(
    { opts, props },
    interactive,
  );

  return promptedProxy;
}

function getCommandProps({
  network,
  contractFullName,
  methodName,
  methodArgs,
}: SendTxPropsParams = {}): InquirerQuestions {
  const methods = methodsList(contractFullName, Mutability.Constant);
  const args = argsList(
    contractFullName,
    methodName,
    Mutability.Constant,
  ).reduce((accum, argName, index) => {
    return {
      ...accum,
      [argName]: {
        message: `${argName}:`,
        type: 'input',
        when: () => !methodArgs || !methodArgs[index],
      },
    };
  }, {});

  return {
    ...networksList('network', 'list'),
    proxy: {
      message: 'Choose an instance',
      type: 'list',
      choices: () => proxiesList('byAddress', network),
      normalize: input =>
        typeof input !== 'object'
          ? proxyInfo(parseContractReference(input), network)
          : input,
    },
    methodName: {
      type: 'list',
      message: 'Select a method',
      choices: methods,
      normalize: input => {
        if (typeof input !== 'object') {
          return { name: input, selector: input };
        } else return input;
      },
    },
    ...args,
  };
}

export default { name, signature, description, register, action };
