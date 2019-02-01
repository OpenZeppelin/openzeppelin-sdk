import BN from 'bignumber.js';

export function parseArgs(args: string): string[] | never {
  if (typeof args !== 'string') throw Error(`Cannot parse ${typeof args}`);

  // The following is inspired from ethereum/remix (Copyright (c) 2016)
  // https://github.com/ethereum/remix/blob/89f34fc4f35eca0c386379550c300205d35bfae0/remix-lib/src/execution/txFormat.js#L51-L53
  try {
    const START_LOOKBEHIND = '(?<=^|([,[]\\s*))'; // Character before match is start of line, comma or opening bracket.
    const END_LOOKAHEAD = '(?=$|([,\\]]\\s*))'; // Character after match is end of line, comma or closing bracket.

     // Replace non quoted hex string by quoted hex string.
    const MATCH_HEX = '(0[xX][0-9a-fA-F]+)'; // Match '0x' followed by 'a' to 'f' characters, case insensitively.
    args = args.replace(new RegExp(START_LOOKBEHIND + MATCH_HEX + END_LOOKAHEAD, 'g'), '"$2"');

    // Replace scientific notation numbers by regular numbers.
    const MATCH_SCIENTIFIC = '(\\s*[-]?\\d+(\\.\\d+)?e(\\+)?\\d+\\s*)'; // Match scientific notation numbers like -1.5e20.
    args = args.replace(new RegExp(START_LOOKBEHIND + MATCH_SCIENTIFIC + END_LOOKAHEAD, 'g'), (val) => `${(new BN(val)).toString(10)}`);

     // Replace non quoted number by quoted number.
    const MATCH_WORDS = '([-]?\\w+)';
    args = args.replace(new RegExp(START_LOOKBEHIND + MATCH_WORDS + END_LOOKAHEAD, 'g'), '"$2"');

    return JSON.parse('[' + args + ']');
  } catch (e) {
    throw Error(`Error parsing arguments: ${e}`);
  }
}

export function parseInit(options: any, defaultInit: any): { initMethod: string, initArgs: string[] } {
  let initMethod = options.init;
  if (typeof initMethod === 'boolean') initMethod = defaultInit;
  if (!initMethod && typeof options.args !== 'undefined') initMethod = defaultInit;

  let initArgs = options.args;
  if(typeof initArgs === 'string') initArgs = parseArgs(initArgs);
  else if(typeof initArgs === 'boolean' || initMethod) initArgs = [];

  return { initMethod, initArgs };
}
