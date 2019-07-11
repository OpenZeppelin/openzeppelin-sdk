import { ContractMethodMutability as Mutability } from '@openzeppelin/upgrades';
import pickBy from 'lodash.pickby';
import isUndefined from 'lodash.isundefined';
import negate from 'lodash.negate';

import { parseMethodParams, parseArg } from '../utils/input';
import { promptIfNeeded, argsList, methodsList, InquirerQuestions } from './prompt';

type PropsFn = (any) => InquirerQuestions;

interface CommandProps {
  contractFullName: string;
  methodName: string;
  methodArgs: string[];
  additionalOpts?: { [key: string]: any };
}

export default async function promptForMethodParams(
  contractFullName: string,
  options: any,
  additionalOpts: { [key: string]: string } = {},
  constant: Mutability = Mutability.NotConstant,
): Promise<{ methodName: string; methodArgs: string[] }> {
  const { interactive } = options;
  let { methodName, methodArgs } = parseMethodParams(options, 'initialize');
  const opts = { ...additionalOpts, methodName };

  const methodProps = getCommandProps(contractFullName, methodName, methodArgs, constant, additionalOpts);

  // prompt for method name if not provided
  ({ methodName } = await promptIfNeeded({ opts, props: methodProps }, interactive));

  const methodArgsKeys = argsList(contractFullName, methodName.selector, constant).reduce(
    (accum, { name: current }) => ({ ...accum, [current]: undefined }),
    {},
  );

  // if there are no methodArgs defined, or the methodArgs array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!methodArgs || methodArgs.length < Object.keys(methodArgsKeys).length) {
    const methodArgsProps = getCommandProps(contractFullName, methodName.selector, methodArgs, constant);

    const promptedArgs = await promptIfNeeded({ opts: methodArgsKeys, props: methodArgsProps }, interactive);
    methodArgs = [...methodArgs, ...Object.values(pickBy(promptedArgs, negate(isUndefined)))];
  }

  return { methodName: methodName.selector, methodArgs };
}

function getCommandProps(
  contractFullName: string,
  methodName: string,
  methodArgs: string[],
  constant: Mutability,
  additionalOpts = {},
): InquirerQuestions {
  const methods = methodsList(contractFullName, constant);
  const args = argsList(contractFullName, methodName, constant).reduce((accum, arg, index) => {
    return {
      ...accum,
      [arg.name]: {
        message: `${arg.name} (${arg.type}):`,
        type: 'input',
        when: () => !methodArgs || !methodArgs[index],
        validate: input => {
          try {
            parseArg(input, arg.type);
            return true;
          } catch (err) {
            return `${err.message}. Enter a valid ${arg.type} such as: ${getPlaceholder(arg.type)}.`;
          }
        },
        normalize: input => parseArg(input, arg.type),
      },
    };
  }, {});

  return {
    askForMethodParams: {
      type: 'confirm',
      message: additionalOpts['askForMethodParamsMessage'],
      when: () =>
        methods.length !== 0 && methodName !== 'initialize' && additionalOpts.hasOwnProperty('askForMethodParams'),
    },
    methodName: {
      type: 'list',
      message: 'Select which function',
      choices: methods,
      when: ({ askForMethodParams }) =>
        !additionalOpts.hasOwnProperty('askForMethodParams') ||
        (additionalOpts.hasOwnProperty('askForMethodParams') && askForMethodParams),
      normalize: input => {
        if (typeof input !== 'object') {
          return { name: input, selector: input };
        } else return input;
      },
    },
    ...args,
  };
}

function getPlaceholder(type: string): string {
  const ARRAY_TYPE_REGEX = /(.+)\[\d*\]$/; // matches array type identifiers like uint[] or byte[4]

  if (type.match(ARRAY_TYPE_REGEX)) {
    const arrayType = type.match(ARRAY_TYPE_REGEX)[1];
    const itemPlaceholder = getPlaceholder(arrayType);
    return `[${itemPlaceholder}, ${itemPlaceholder}]`;
  } else if (
    type.startsWith('uint') ||
    type.startsWith('int') ||
    type.startsWith('fixed') ||
    type.startsWith('ufixed')
  ) {
    return '42';
  } else if (type === 'bool') {
    return 'true';
  } else if (type === 'bytes') {
    return '0xabcdef';
  } else if (type === 'address') {
    return '0x1df62f291b2e969fb0849d99d9ce41e2f137006e';
  } else if (type === 'string') {
    return 'Hello world';
  } else {
    return null;
  }
}
