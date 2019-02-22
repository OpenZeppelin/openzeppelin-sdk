import isEmpty from 'lodash.isempty';

import Inquirer from 'inquirer';
import Truffle from '../models/initializer/truffle/Truffle';

interface Prompt {
  args?: {};
  props?: {};
  defaults?: {};
}

export async function promptForArgumentsIfNeeded({ args, defaults, props }: Prompt): Inquirer {
  const questions = Object.keys(args)
    .filter((argName) => !args[argName] || isEmpty(args[argName]) || (defaults && !defaults[argName]))
    .map((argName) => promptFor(argName, defaults, props));

  return { ...args, ...(await Inquirer.prompt(questions)) };
}

function promptFor(argName: string, defaults: {}, props: {}) {
  const defaultValue = defaults ? defaults[argName] : undefined;
  return {
    default: defaultValue,
    type: props[argName].type,
    message: props[argName].message,
    name: argName,
    choices: props[argName].choices,
  };
}
