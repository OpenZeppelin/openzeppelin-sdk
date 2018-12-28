import abi from 'ethereumjs-abi';
import * as util from 'ethereumjs-util';
import BN from 'bignumber.js';
import _ from 'lodash';

const ERROR_MESSAGE_PREFIX = 'Invalid parameter';
const ERROR_MESSAGE_POSITIVE_NUMBER = (value) => `${ERROR_MESSAGE_PREFIX} number "${value}" must be positive.`;
const ERROR_MESSAGE_INTEGER_NUMBER = (value) => `${ERROR_MESSAGE_PREFIX} number "${value}" must be an integer.`;
const ERROR_MESSAGE_NUMBER = (value) => `${ERROR_MESSAGE_PREFIX} number "${value}".`;
const ERROR_MESSAGE_ADDRESS = (value) => `${ERROR_MESSAGE_PREFIX} address "${value}".`;
const ERROR_MESSAGE_CHECKSUM_ADDRESS = (value) => `${ERROR_MESSAGE_PREFIX} address "${value}" checksum fails.`;
const ERROR_MESSAGE_BYTES = (value) => `${ERROR_MESSAGE_PREFIX} bytes "${value}".`;
const ERROR_MESSAGE_STRING = (value) => `${ERROR_MESSAGE_PREFIX} string "${value}".`;

export default function encodeCall(name: string, types: string[] = [], rawValues: any[] = []): string {
  if(types.length !== rawValues.length) throw new Error('Supplied number of types and values do not match.');
  const values =_.zipWith(types, rawValues, (type: string, value: any) => parseTypeValuePair(type, value));
  const methodId = abi.methodID(name, types).toString('hex');
  const params = abi.rawEncode(types, values).toString('hex');
  return '0x' + methodId + params;
}

export function parseTypeValuePair(type: string, rawValue: any): string | never {
  if(type === 'address') {
    return parseAddress(rawValue);
  }
  else if(type === 'string') {
    return rawValue; // Validated by ethereumjs-abi.
  }
  else if(type.startsWith('bytes') && !type.includes('[]')) {
    return parseBytes(rawValue);
  }
  else if(type.startsWith('uint') && !type.includes('[]')) {
    return parseNumber(rawValue, true);
  }
  else if(type.startsWith('int') && !type.includes('[]')) {
    return parseNumber(rawValue, false);
  }
  else {
    // TODO: parse remianing types: fixed, arrays, etc.
    return rawValue;
  }
}

function parseBytes(rawValue: any): string | never {
  if(typeof(rawValue) !== 'string') throw new Error(ERROR_MESSAGE_BYTES(rawValue));
  if(rawValue.toString().length === 0) return rawValue;
  if(!/^(0x)?[0-9a-f]$/i.test(rawValue)) throw new Error(ERROR_MESSAGE_BYTES(rawValue));
  return rawValue;
}

function parseAddress(rawValue: any): string | never {
  if(typeof(rawValue) !== 'string') throw new Error(ERROR_MESSAGE_ADDRESS(rawValue));
  if(!/^(0x)?[0-9a-f]{40}$/i.test(rawValue)) throw new Error(ERROR_MESSAGE_ADDRESS(rawValue));
  // TODO: It'd be nice to perform a checksum validation here.
  return rawValue;
}

function parseNumber(rawValue: any, mustBePositive: boolean): string | never {
  // Convert to lower case if type is string. Required by BN to properly interpret hexadecimals.
  if(typeof(rawValue) === 'string') rawValue = <string>rawValue.toLowerCase();
  if(isNaN(rawValue)) throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
  // Funnel everything through bignumber.js.
  if(typeof(rawValue) === 'number' || typeof(rawValue) === 'string' || BN.isBigNumber(rawValue)) {
    const bn = BN.isBigNumber(rawValue) ? rawValue : new BN(rawValue);
    if(bn.isNaN()) throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
    if(mustBePositive && bn.isNegative()) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(rawValue));
    if(!bn.isInteger()) throw new Error(ERROR_MESSAGE_INTEGER_NUMBER(rawValue));
    return bn.toString(10);
  }
  // Throw on other cases, if any.
  throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
}
