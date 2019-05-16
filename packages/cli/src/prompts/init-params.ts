import { ContractMethodMutability as Mutability } from 'zos-lib';
import pickBy from 'lodash.pickby';
import isUndefined from 'lodash.isundefined';
import negate from 'lodash.negate';

import { parseInit } from '../utils/input';
import { promptIfNeeded, argsList, InquirerQuestions } from './prompt';

type PropsFn = (any) => InquirerQuestions;

export default async function promptForMethodParams(
  contractFullName: string,
  getCommandProps: PropsFn,
  options: any,
  additionalOpts: { [key: string]: string } = {},
  constant: Mutability = Mutability.NotConstant
): Promise<{ initMethod: string, initArgs: string[] }> {

  const { interactive } = options;
  let { initMethod, initArgs } = parseInit(options, 'initialize');
  const opts = { ...additionalOpts, initMethod };
  const methodProps = getCommandProps({ contractFullName, initMethod });

  // prompt for method name if not provided
  ({ initMethod } = await promptIfNeeded({ opts, props: methodProps }, interactive));

  const methodArgsKeys = argsList(contractFullName, initMethod.selector, constant)
    .reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no initArgs defined, or the initArgs array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!initArgs || initArgs.length < Object.keys(methodArgsKeys).length) {
    const methodArgsProps = getCommandProps({ contractFullName, initMethod: initMethod.selector, initArgs });
    const promptedArgs = await promptIfNeeded({ opts: methodArgsKeys, props: methodArgsProps }, interactive);
    initArgs = [...initArgs, ...Object.values(pickBy(promptedArgs, negate(isUndefined)))];
  }

  return { initMethod: initMethod.name, initArgs };
}
