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
  const values = [];
  _.zipWith(types, rawValues, function(type: string, value: any) {
    values.push(parseTypeValuePair(type, value));
  });
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

function parseBytes(value: any): string | never {
  if(typeof(value) !== 'string') throw new Error(ERROR_MESSAGE_BYTES(value));
  if(!/^(0x)?[0-9a-f]$/i.test(value)) throw new Error(ERROR_MESSAGE_BYTES(value));
  return value;
}

function parseAddress(value: any): string | never {
  if(typeof(value) !== 'string') throw new Error(ERROR_MESSAGE_ADDRESS(value));
  if(!/^(0x)?[0-9a-f]{40}$/i.test(value)) throw new Error(ERROR_MESSAGE_ADDRESS(value));
  // TODO: It'd be nice to perform a checksum validation here.
  return value;
}

function parseNumber(value: any, mustBePositive: boolean): string | never {
  if(typeof(value) === 'number') return parseNumberFromLiteral(value, mustBePositive);
  else if(typeof(value) === 'string') return parseNumberFromString(value, mustBePositive);
  else if(BN.isBigNumber(value)) return parseNumberFromBigNumber(new BN(value), mustBePositive);
  throw new Error(ERROR_MESSAGE_NUMBER(value));
}

function parseNumberFromBigNumber(value: BN, mustBePositive: boolean): string | never {
  if(mustBePositive && value.isNegative()) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(value));
  if(!value.isInteger()) throw new Error(ERROR_MESSAGE_INTEGER_NUMBER(value));
  return value.toString();
}

function parseNumberFromString(value: string, mustBePositive: boolean): string | never {
  if(isNaN(<any>value)) throw new Error(ERROR_MESSAGE_NUMBER(value));
  if(value.startsWith('0x') || value.startsWith('0X')) { // Hex.
    if(!isNaN(parseInt(value, 16))) throw new Error(ERROR_MESSAGE_NUMBER(value));
    if(mustBePositive && parseInt(value, 16) < 0) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(value));
    return value;
  }
  else { // Not hex.
    if(value.match(/\d+(\.\d+)?e(\+)?\d+/)) { // Numeric strings with exponents, e.g. '1.5e9'.
      return parseNumberFromBigNumber(new BN(value), mustBePositive);
    }
    else { // Not exponential.
      if(value.indexOf('.') !== -1) throw new Error(ERROR_MESSAGE_INTEGER_NUMBER(value));
      const valueNum = parseInt(value, 10);
      if(valueNum < 0) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(value));
      return value;
    }
  }
}

function parseNumberFromLiteral(value: number, mustBePositive: boolean): string | never {
  if(value % 1 !== 0) throw new Error(ERROR_MESSAGE_INTEGER_NUMBER(value));
  if(mustBePositive && value < 0) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(value));
  return value.toString();
}
