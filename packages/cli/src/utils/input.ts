export function parseArgs(args: string): string[] | never {
  if (typeof args !== 'string') throw Error(`Cannot parse ${typeof args}`);

  // The following is inspired from ethereum/remix (Copyright (c) 2016)
  // https://github.com/ethereum/remix/blob/89f34fc4f35eca0c386379550c300205d35bfae0/remix-lib/src/execution/txFormat.js#L51-L53
  try {
    const MATCH_HEX = /(^|([,[]\s*))(0[xX][0-9a-fA-F]+)/g;
    args = args.replace(MATCH_HEX, '$2"$3"'); // replace non quoted hex string by quoted hex string

    const MATCH_WORDS = /(^|([,[]\s*))(\w+)/g;
    args = args.replace(MATCH_WORDS, '$2"$3"'); // replace non quoted number by quoted number

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
