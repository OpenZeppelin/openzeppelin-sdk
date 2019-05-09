import pickBy from 'lodash.pickby';

import sendTx from '../scripts/send-tx';
import { parseContractReference } from '../utils/contract';
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer';
import { promptIfNeeded, networksList, promptForNetwork, argsList, methodsList, proxiesList, proxyInfo, InquirerQuestions } from '../prompts/prompt';
import { SendTxPropsParams, SendTxSelectionParams } from './interfaces';
import promptForMethod from '../prompts/method-params';

const name: string = 'send-tx';
const signature: string = name;
const description: string = 'Send a transaction to the specified contract instance. Provide the [address], method to call and its arguments if needed';

const register: (program: any) => any = (program) => program
  .command(signature, undefined, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--to <to>', 'specify a contract instance address')
  .option('--method <method>', `specify a method name from the specified contract`)
  .option('--args <arg1, arg2, ...>', 'provide the method arguments for your contract if required')
  .option('--value <value>', `specify a value in wei to send to the method`)
  .option('--gas <gas>', `specify an amount of gas to use`)
  .withNetworkOptions()
  .withNonInteractiveOption()
  .action(action);

async function action(options: any): Promise<void> {
  const { interactive, to: proxyAddress, value, gas } = options;
  const networkOpts = await promptForNetwork(options, () => getCommandProps());
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({ ...options, ...networkOpts });

  const { contractFullName, proxyReference } = await promptForProxy(proxyAddress, network, options);
  const methodParams = await promptForMethod(contractFullName, getCommandProps, options);
  const args = pickBy({ ...methodParams, proxyAddress: proxyReference, value, gas });
  await sendTx({ ...args, network, txParams });

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

async function promptForProxy(proxyAddress: string, network: string, options: any): Promise<SendTxSelectionParams> {
  const { interactive } = options;
  const opts = { proxy: proxyAddress };
  const props = getCommandProps({ network });
  const { proxy: promptedProxy } = await promptIfNeeded({ opts, props }, interactive);

  return promptedProxy;
}

function getCommandProps({ network, contractFullName, methodName, methodArgs }: SendTxPropsParams = {}): InquirerQuestions {
  const methods = methodsList(contractFullName);
  const args = argsList(contractFullName, methodName)
    .reduce((accum, argName, index) => {
      return {
        ...accum,
        [argName]: {
          message: `${argName}:`,
          type: 'input',
          when: () => !methodArgs || !methodArgs[index]
        }
      };
    }, {});

  return {
    ...networksList('network', 'list'),
    proxy: {
      message: 'Choose an instance',
      type: 'list',
      choices: () => proxiesList('byAddress', network),
      normalize: (input) => typeof input !== 'object' ? proxyInfo(parseContractReference(input), network) : input
    },
    methodName: {
      type: 'list',
      message: 'Select a method',
      choices: methods,
      normalize: (input) => {
        if (typeof input !== 'object') {
          return { name: input, selector: input };
        } else return input;
      }
    },
    ...args
  };
}

export default { name, signature, description, register, action };
