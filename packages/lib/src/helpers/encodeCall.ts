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

function parseBytes(rawValue: string | Buffer): string | never {
  if(Buffer.isBuffer(rawValue)) return rawValue.toString();
  else if(typeof(rawValue) === 'string') {
    if(rawValue.toString().length === 0) return rawValue;
    // Require buffers expressed as strings to be valid hexadecimals.
    if(!/^(0x)[0-9a-f]+$/i.test(rawValue)) throw new Error(ERROR_MESSAGE_BYTES(rawValue));
    // Test the validity of the buffer.
    if(Buffer.from(rawValue.substring(2), 'hex').length === 0) throw new Error(ERROR_MESSAGE_BYTES(rawValue));
    return rawValue;
  }
}

function parseAddress(rawValue: string | Buffer): string | never {
  const strAddress = rawValue.toString();
  if(!util.isValidAddress(strAddress)) throw new Error(ERROR_MESSAGE_ADDRESS(rawValue));
  // If the address' characters are not all uppercase or lowercase, assume that there is checksum to validate.
  if(/[a-f]/.test(strAddress.substring(2)) && /[A-F]/.test(strAddress.substring(2))) {
    if(!util.isValidChecksumAddress(strAddress)) throw new Error(ERROR_MESSAGE_CHECKSUM_ADDRESS(rawValue));
  }
  return strAddress;
}

function parseNumber(rawValue: number | string | BN, mustBePositive: boolean): string | never {
  if(isNaN(<any>rawValue)) throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
  if(typeof(rawValue === 'number') && !isFinite(<any>rawValue)) throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
  if(typeof(rawValue) === 'string') rawValue = (<string>rawValue).toLowerCase();
  // Funnel everything through bignumber.js.
  const bn = BN.isBigNumber(rawValue) ? <BN>rawValue : new BN(rawValue);
  if(bn.isNaN()) throw new Error(ERROR_MESSAGE_NUMBER(rawValue));
  if(mustBePositive && bn.isNegative()) throw new Error(ERROR_MESSAGE_POSITIVE_NUMBER(rawValue));
  if(!bn.isInteger()) throw new Error(ERROR_MESSAGE_INTEGER_NUMBER(rawValue));
  return bn.toString(10);
}
