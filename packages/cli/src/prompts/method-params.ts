import { ContractMethodMutability as Mutability } from 'zos-lib';
import pickBy from 'lodash.pickby';
import isUndefined from 'lodash.isundefined';
import negate from 'lodash.negate';

import { parseMethodParams } from '../utils/input';
import { promptIfNeeded, argsList, InquirerQuestions } from './prompt';

type PropsFn = (any) => InquirerQuestions;

export default async function promptForMethodParams(
  contractFullName: string,
  getCommandProps: PropsFn,
  options: any,
  additionalOpts: { [key: string]: string } = {},
  constant: Mutability = Mutability.NotConstant,
): Promise<{ methodName: string; methodArgs: string[] }> {
  const { interactive } = options;
  let { methodName, methodArgs } = parseMethodParams(options, 'initialize');
  const opts = { ...additionalOpts, methodName };
  const methodProps = getCommandProps({ contractFullName, methodName });

  // prompt for method name if not provided
  ({ methodName } = await promptIfNeeded(
    { opts, props: methodProps },
    interactive,
  ));

  const methodArgsKeys = argsList(
    contractFullName,
    methodName.selector,
    constant,
  ).reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no methodArgs defined, or the methodArgs array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!methodArgs || methodArgs.length < Object.keys(methodArgsKeys).length) {
    const methodArgsProps = getCommandProps({
      contractFullName,
      methodName: methodName.selector,
      methodArgs,
    });
    const promptedArgs = await promptIfNeeded(
      { opts: methodArgsKeys, props: methodArgsProps },
      interactive,
    );
    methodArgs = [
      ...methodArgs,
      ...Object.values(pickBy(promptedArgs, negate(isUndefined))),
    ];
  }

  return { methodName: methodName.name, methodArgs };
}
