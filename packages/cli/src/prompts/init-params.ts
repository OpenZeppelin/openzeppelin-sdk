import pickBy from 'lodash.pickby';
import isUndefined from 'lodash.isundefined';
import negate from 'lodash.negate';
import { parseInit } from '../utils/input';
import { promptIfNeeded, argsList, InquirerQuestions } from './prompt';

type PropsFn = (any) => InquirerQuestions;

export default async function promptForInitParams(contractFullName: string, getCommandProps: PropsFn, options: any): Promise<{ initMethod: string, initArgs: string[] }> {
  const { interactive } = options;
  let { initMethod, initArgs } = parseInit(options, 'initialize');
  const { init: rawInitMethod } = options;
  const opts = { askForInitParams: rawInitMethod, initMethod };
  const initMethodProps = getCommandProps({ contractFullName, initMethod });

  // prompt for init method if not provided
  ({ initMethod } = await promptIfNeeded({ opts, props: initMethodProps }, interactive));

  const initArgsKeys = argsList(contractFullName, initMethod.selector)
    .reduce((accum, current) => ({ ...accum, [current]: undefined }), {});

  // if there are no initArgs defined, or the initArgs array length provided is smaller than the
  // number of arguments in the function, prompt for remaining arguments
  if (!initArgs || initArgs.length < Object.keys(initArgsKeys).length) {
    const initArgsProps = getCommandProps({ contractFullName, initMethod: initMethod.selector, initArgs });
    const promptedArgs = await promptIfNeeded({ opts: initArgsKeys, props: initArgsProps }, interactive);
    initArgs = [...initArgs, ...Object.values(pickBy(promptedArgs, negate(isUndefined)))];
  }

  return { initMethod: initMethod.name, initArgs };
}
