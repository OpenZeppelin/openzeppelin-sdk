import isEmpty from 'lodash.isempty';

import Inquirer from 'inquirer';
import Truffle from '../models/initializer/truffle/Truffle';

const ARGUMENTS_PROPS = {
  name: {
    message: 'Welcome to ZeppelinOS! Choose a name for your project:',
    type: 'input'
  },
  version: {
    message: 'Choose a version:',
    type: 'input',
  },
};

interface Prompt {
  args?: {};
  props?: {};
  defaults?: {};
}

export async function promptForArgumentsIfNeeded({ args, defaults, props = ARGUMENTS_PROPS }: Prompt): Inquirer {
  const questions = Object.keys(args)
    .filter((argName) => !args[argName] || isEmpty(args[argName]) || (defaults && !defaults[argName]))
    .map((argName) => promptFor(argName, defaults, props));

  return Inquirer.prompt(questions);
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
