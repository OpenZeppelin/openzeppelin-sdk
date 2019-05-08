import BN from 'bignumber.js';
import { encodeParams } from 'zos-lib';

export function parseArgs(args: string): string[] | never {
  if (typeof args !== 'string') throw Error(`Cannot parse ${typeof args}`);

  // The following is inspired from ethereum/remix (Copyright (c) 2016)
  // https://github.com/ethereum/remix/blob/89f34fc4f35eca0c386379550c300205d35bfae0/remix-lib/src/execution/txFormat.js#L51-L53
  try {
    const START_LOOKBEHIND = '(?<=^|([,[]\\s*))'; // Character before match is start of line, comma or opening bracket.
    const END_LOOKAHEAD = '(?=$|([,\\]]\\s*))'; // Character after match is end of line, comma or closing bracket.

     // Replace non quoted hex string by quoted hex string.
    const MATCH_HEX = new RegExp(START_LOOKBEHIND + '(0[xX][0-9a-fA-F]+)'+ END_LOOKAHEAD, 'g');
    args = args.replace(MATCH_HEX, '"$2"');

    // Replace scientific notation numbers by regular numbers.
    const MATCH_SCIENTIFIC = new RegExp(START_LOOKBEHIND + '(\\s*[-]?\\d+(\\.\\d+)?e(\\+)?\\d+\\s*)'+ END_LOOKAHEAD, 'g');
    args = args.replace(MATCH_SCIENTIFIC, (val) => `${(new BN(val)).toString(10)}`);

     // Replace non quoted number by quoted number.
    const MATCH_WORDS = new RegExp(START_LOOKBEHIND + '([-]?\\w+)'+ END_LOOKAHEAD, 'g');
    args = args.replace(MATCH_WORDS, '"$2"');

    // Parse string to array.
    const parsedArgs = JSON.parse('[' + args + ']');

    // Replace boolean strings with boolean literals.
    return parsedArgs.map((value) => {
      if(typeof value === 'string') {
        if(value.toLowerCase() === 'false') return false;
        else if(value.toLowerCase() === 'true') return true;
      }
      return value;
    });
  } catch (e) {
    throw Error(`Error parsing arguments: ${e}`);
  }
}

export function parseMethodParams(options: any, defaultMethod?: string): { methodName: any, methodArgs: any[] } {
  let { init: methodName, args: methodArgs } = options;

  if (typeof methodName === 'boolean') methodName = defaultMethod;
  if (!methodName && typeof methodArgs !== 'undefined') methodName = defaultMethod;

  if(typeof methodArgs === 'string') methodArgs = parseArgs(methodArgs);
  else if(!methodArgs || typeof methodArgs === 'boolean' || methodName) methodArgs = [];

  return { methodName, methodArgs };
}

export function validateSalt(salt: string, required = false) {
  if (!salt || salt.length === 0) {
    if (required) {
      throw new Error('A non-empty salt is required to calculate the deployment address.');
    } else {
      return;
    }
  }
  try {
    encodeParams(['uint256'], [salt]);
  } catch(err) {
    throw new Error(`Invalid salt ${salt}, must be an uint256 value.`);
  }
}
