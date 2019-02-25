import isEmpty from 'lodash.isempty';
import Inquirer from 'inquirer';
import Truffle from '../models/initializer/truffle/Truffle';

interface PromptParams {
  args?: {};
  props?: {};
  defaults?: {};
}

// TS-TODO: Define a more accurate return type as soon as we know the final structure of it
export async function promptForArgumentsIfNeeded({ args, defaults, props }: PromptParams): Promise<any> {
  const questions = Object.keys(args)
    .filter((argName) => !args[argName] || isEmpty(args[argName]))
    .map((argName) => promptFor(argName, defaults, props));

  return { ...args, ...(await Inquirer.prompt(questions)) };
}

export function getContractsList(message, type) {
  const contractList = Truffle.getContractNames();
  return {
    contractNames: {
      type,
      message,
      choices: contractList
    }
  };
}

function promptFor(argName: string, defaults: {}, props: {}): { [key: string]: any } {
  const defaultValue = defaults ? defaults[argName] : undefined;
  return {
    default: defaultValue,
    type: props[argName].type,
    message: props[argName].message,
    name: argName,
    choices: props[argName].choices,
  };
}
