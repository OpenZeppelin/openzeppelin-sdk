import isEmpty from 'lodash.isempty';
import Inquirer from 'inquirer';
import Truffle from '../models/initializer/truffle/Truffle';

interface Args {
  args?: {};
  opts?: {};
  props?: {};
  defaults?: {};
}

interface GenericObject {
  [key: string]: any;
}

// TS-TODO: Define a more accurate return type as soon as we know the final structure of it
export async function promptIfNeeded({ args = {}, opts = {}, defaults, props }: Args): Promise<any> {
  const argsQuestions = Object.keys(args)
    .filter((argName) => !args[argName] || isEmpty(args[argName]))
    .map((argName) => promptFor(argName, defaults, props));

  const optsQuestions = Object.keys(opts)
    .filter((optName) => !opts[optName])
    .map((optName) => promptFor(optName, {}, props));

  return { ...args, ...opts, ...await answersFor(argsQuestions), ...await answersFor(optsQuestions) };
}

export function getContractsList(name, message, type) {
  const contractList = Truffle.getContractNames();
  return {
    [name]: {
      type,
      message,
      choices: contractList
    }
  };
}

export function getNetworkList(type) {
  const networkList = Truffle.getNetworkNamesFromConfig();
  return {
    network: {
      type,
      message: 'Select a network from the network list',
      choices: networkList
    }
  };
}

function promptFor(name: string, defaults: {}, props: {}): GenericObject {
  const defaultValue = defaults ? defaults[name] : undefined;
  return {
    name,
    type: props[name].type,
    message: props[name].message,
    choices: props[name].choices,
    when: props[name].when,
    default: defaultValue || props[name].default
  };
}

async function answersFor(questions) {
  return Inquirer.prompt(questions);
}
