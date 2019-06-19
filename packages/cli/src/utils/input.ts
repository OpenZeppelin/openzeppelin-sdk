import BN from 'bignumber.js';
import flattenDeep from 'lodash.flattendeep';
import { encodeParams, Loggy, ZWeb3 } from 'zos-lib';

// TODO: Deprecate in favor of a combination of parseArg and parseArray
export function parseArgs(args: string): string[] | never {
  if (typeof args !== 'string') throw Error(`Cannot parse ${typeof args}`);

  // The following is inspired from ethereum/remix (Copyright (c) 2016)
  // https://github.com/ethereum/remix/blob/89f34fc4f35eca0c386379550c300205d35bfae0/remix-lib/src/execution/txFormat.js#L51-L53
  try {
    // Parse string to array.
    const parsedArgs = JSON.parse(`[${quoteArguments(args)}]`);

    // Replace boolean strings with boolean literals.
    return parsedArgs.map(value => {
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'false') return false;
        else if (value.toLowerCase() === 'true') return true;
      }
      return value;
    });
  } catch (e) {
    throw Error(`Error parsing arguments: ${e}`);
  }
}

function quoteArguments(args: string) {
  const START_LOOKBEHIND = '(?<=^|([,[]\\s*))'; // Character before match is start of line, comma or opening bracket.
  const END_LOOKAHEAD = '(?=$|([,\\]]\\s*))'; // Character after match is end of line, comma or closing bracket.

  // Replace non quoted hex string by quoted hex string.
  const MATCH_HEX = new RegExp(
    START_LOOKBEHIND + '(0[xX][0-9a-fA-F]+)' + END_LOOKAHEAD,
    'g',
  );
  args = args.replace(MATCH_HEX, '"$2"');

  // Replace scientific notation numbers by regular numbers.
  const MATCH_SCIENTIFIC = new RegExp(
    START_LOOKBEHIND +
      '(\\s*[-]?\\d+(\\.\\d+)?e(\\+)?\\d+\\s*)' +
      END_LOOKAHEAD,
    'g',
  );
  args = args.replace(MATCH_SCIENTIFIC, val => `${new BN(val).toString(10)}`);

  // Replace non quoted number by quoted number.
  const MATCH_WORDS = new RegExp(
    START_LOOKBEHIND + '([-]?\\w+)' + END_LOOKAHEAD,
    'g',
  );
  args = args.replace(MATCH_WORDS, '"$2"');
  return args;
}

export function parseArg(input: string | string[], type: string): any {
  const TRUE_VALUES = ['y', 'yes', 't', 'true', '1'];
  const FALSE_VALUES = ['n', 'no', 'f', 'false', '0'];
  const ARRAY_TYPE_REGEX = /(.+)\[\d*\]$/; // matches array type identifiers like uint[] or byte[4]

  // TODO: Handle tuples in ABI specification

  // Arrays: recursively parse
  if (type.match(ARRAY_TYPE_REGEX)) {
    const arrayType = type.match(ARRAY_TYPE_REGEX)[1];
    const inputs =
      typeof input === 'string' ? parseArray(stripBrackets(input)) : input;
    return inputs.map(input => parseArg(input, arrayType));
  }

  // Integers: passed via bignumber to handle signs and scientific notation
  else if (
    (type.startsWith('uint') ||
      type.startsWith('int') ||
      type.startsWith('fixed') ||
      type.startsWith('ufixed')) &&
    requireInputString(input)
  ) {
    const parsed = new BN(input);
    if (parsed.isNaN())
      throw new Error(`Could not parse '${input}' as ${type}`);
    return parsed.toString(10);
  }

  // Booleans: match against true, t, yes, 1, etc
  else if (type === 'bool' && requireInputString(input)) {
    const lowercaseInput = input.toLowerCase();
    if (TRUE_VALUES.includes(lowercaseInput)) return true;
    else if (FALSE_VALUES.includes(lowercaseInput)) return false;
    else throw new Error(`Could not parse boolean value ${input}`);
  }

  // Address: just validate them
  else if (type === 'address' && requireInputString(input)) {
    if (!ZWeb3.isAddress(input)) {
      throw new Error(`${input} is not a valid address`);
    }
    return input;
  }

  // Bytes: same, just check they are a valid hex
  else if (type.startsWith('bytes') && requireInputString(input)) {
    if (!ZWeb3.isHex(input)) {
      throw new Error(`${input} is not a valid hexadecimal`);
    }
    return input;
  }

  // Strings: pass through
  else if (type === 'string' && requireInputString(input)) {
    return input;
  }

  // Warn if we see a type we don't recognise, but return it as is
  else {
    Loggy.noSpin.warn(
      __filename,
      'parseArg',
      `Unknown argument ${type} (skipping input validation)`,
    );
    return input;
  }
}

export function stripBrackets(inputMaybeWithBrackets: string): string {
  return `${inputMaybeWithBrackets
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')}`;
}

function requireInputString(arg: string | string[]): arg is string {
  if (typeof arg !== 'string') {
    throw new Error(
      `Expected ${flattenDeep(arg).join(
        ',',
      )} to be a scalar value but was an array`,
    );
  }
  return true;
}

/**
 * Parses a string as an arbitrarily nested array of strings. Handles
 * unquoted strings in the input, or quotes using both simple and double quotes.
 * @param input string to parse
 * @returns parsed ouput.
 * The return type is a lie! This function returns a recursive type,
 * with arbitrarily nested string arrays, but ts has a hard time handling that,
 * so we're fooling it into thinking it's just one level deep.
 */
export function parseArray(input: string): (string | string[])[] {
  let i = 0; // index for traversing input

  function innerParseQuotedString(quoteChar: string): string {
    const start = i;
    while (i < input.length) {
      const char = input[i++];
      if (char === quoteChar) return input.slice(start, i - 1);
      else continue;
    }

    throw new Error(`Unterminated string literal ${input.slice(start)}`);
  }

  function innerParseUnquotedString(): string {
    const start = i;
    while (i < input.length) {
      const char = input[i++];
      if (char === ',') {
        return input.slice(start, i - 1);
      } else if (char === '"' || char === "'") {
        throw new Error(`Unexpected quote at position ${i}`);
      } else if (char === '[' || char === "'") {
        throw new Error(`Unexpected opening bracket at position ${i}`);
      } else if (char === ']') {
        return input.slice(start, --i);
      }
    }
    return input.slice(start, i);
  }

  function requireCommaOrClosing(): void {
    while (i < input.length) {
      const char = input[i++];
      if (char === ' ') {
        continue;
      } else if (char === ',') {
        return;
      } else if (char === ']') {
        i--;
        return;
      } else {
        throw new Error(`Expected a comma after ${input.slice(0, i - 1)}`);
      }
    }
  }

  function innerParseArray(requireClosingBracket = true): string[] {
    const result = [];
    const start = i;
    while (i < input.length) {
      const char = input[i++];
      if (char === ' ') {
        continue;
      } else if (char === '"' || char === "'") {
        result.push(innerParseQuotedString(char));
        requireCommaOrClosing();
      } else if (char === '[') {
        const innerArray = innerParseArray();
        result.push(innerArray);
        requireCommaOrClosing();
      } else if (char === ']') {
        if (!requireClosingBracket)
          throw new Error(
            `Unexpected closing array at position ${i + 1} in ${input}`,
          );
        return result;
      } else {
        i--;
        const unquotedString = innerParseUnquotedString();
        const trimmedString = unquotedString.replace(/\s+$/, '');
        result.push(trimmedString);
      }
    }
    if (requireClosingBracket)
      throw new Error(`Unclosed array ${input.slice(start)}`);
    return result;
  }

  try {
    return innerParseArray(false);
  } catch (err) {
    err.message = `Malformed array argument ${input}: ${err.message}`;
    throw err;
  }
}

export function parseMethodParams(
  options: any,
  defaultMethod?: string,
): { methodName: any; methodArgs: any[] } {
  const { method, init } = options;
  let methodName = method || init;
  let { args: methodArgs } = options;

  if (typeof methodName === 'boolean') methodName = defaultMethod;
  if (!methodName && typeof methodArgs !== 'undefined')
    methodName = defaultMethod;

  // TODO: Change to use parseArray instead
  if (typeof methodArgs === 'string') methodArgs = parseArgs(methodArgs);
  else if (!methodArgs || typeof methodArgs === 'boolean' || methodName)
    methodArgs = [];

  return { methodName, methodArgs };
}

export function validateSalt(salt: string, required = false) {
  if (!salt || salt.length === 0) {
    if (required) {
      throw new Error(
        'A non-empty salt is required to calculate the deployment address.',
      );
    } else {
      return;
    }
  }
  try {
    encodeParams(['uint256'], [salt]);
  } catch (err) {
    throw new Error(`Invalid salt ${salt}, must be an uint256 value.`);
  }
}
