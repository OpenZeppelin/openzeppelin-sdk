import abi from 'ethereumjs-abi';
import * as util from 'ethereumjs-util';
import BN from 'bignumber.js';
import _ from 'lodash';

const ERROR_MESSAGE_PREFIX = 'Encoding error';
const ERROR_MESSAGE = (type: string, value: any) => `${ERROR_MESSAGE_PREFIX} for type ${type} and value ${value.toString()}`;

export default function encodeCall(name: string, types: string[] = [], rawValues: any[] = []): string {
  if(types.length !== rawValues.length) throw new Error(ERROR_MESSAGE_PREFIX + '. Supplied number of types and values do not match.');
  const values =_.zipWith(types, rawValues, (type: string, value: any) => parseTypeValuePair(type, value));
  const methodId = abi.methodID(name, types).toString('hex');
  const params = abi.rawEncode(types, values).toString('hex');
  return '0x' + methodId + params;
}

export function parseTypeValuePair(type: string, rawValue: any): string | string[] | boolean | never {
  // Array type (recurse).
  if(/^[^\[]+\[.*\]$/.test(type)) {
    if(typeof(rawValue) === 'string') rawValue = rawValue.split(',');
    if(rawValue.length === 0) return [];
    const baseType = type.slice(0, type.lastIndexOf('[')); // Remove array part.
    // TODO: validate length on fixed size arrays.
    return _.map(rawValue, (rawValueElement) => parseTypeValuePair(baseType, rawValueElement));
  }
  // Single type.
  if(type === 'address') return parseAddress(type, rawValue);
  else if(type === 'bool') return parseBool(type, rawValue);
  else if(type === 'string') return rawValue; // Validated by ethereumjs-abi.
  else if(type.startsWith('bytes')) return parseBytes(type, rawValue);
  else if(type.startsWith('uint')) return parseNumber(type, rawValue, true, true);
  else if(type.startsWith('int')) return parseNumber(type, rawValue, false, true);
  else if(type.startsWith('ufixed')) return parseNumber(type, rawValue, true, false);
  else if(type.startsWith('fixed')) return parseNumber(type, rawValue, false, false);
  else throw new Error(ERROR_MESSAGE(type, rawValue) + '. Unsupported or invalid type.');
}

function parseBool(type: string, rawValue: string | boolean): boolean | never {
  if(typeof(rawValue) === 'boolean') return <boolean>rawValue;
  else if(typeof(rawValue) === 'string') {
    if(rawValue === 'true') return true;
    else if(rawValue === 'false') return false;
    else throw new Error(ERROR_MESSAGE(type, rawValue));
  }
  throw new Error(ERROR_MESSAGE(type, rawValue));
}

function parseBytes(type: string, rawValue: string | Buffer): string | never {
  if(Buffer.isBuffer(rawValue)) return rawValue.toString();
  else if(typeof(rawValue) === 'string') {
    if(rawValue.toString().length === 0) return rawValue;
    // Require buffers expressed as strings to be valid hexadecimals.
    if(!/^(0x)[0-9a-f]+$/i.test(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
    // Test the validity of the buffer.
    if(Buffer.from(rawValue.substring(2), 'hex').length === 0) throw new Error(ERROR_MESSAGE(type, rawValue));
    return rawValue;
  }
}

function parseAddress(type: string, rawValue: string | Buffer): string | never {
  const strAddress = rawValue.toString();
  if(!util.isValidAddress(strAddress)) throw new Error(ERROR_MESSAGE(type, rawValue));
  // If the address' characters are not all uppercase or lowercase, assume that there is checksum to validate.
  if(/[a-f]/.test(strAddress.substring(2)) && /[A-F]/.test(strAddress.substring(2))) {
    if(!util.isValidChecksumAddress(strAddress)) throw new Error(ERROR_MESSAGE(type, rawValue) + '. Checksum error.');
  }
  return strAddress;
}

function parseNumber(type: string, rawValue: number | string | BN, mustBePositive: boolean, mustBeInteger: boolean): string | never {
  if(isNaN(<any>rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(typeof(rawValue === 'number') && !isFinite(<any>rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(typeof(rawValue) === 'string') rawValue = (<string>rawValue).toLowerCase();
  // Funnel everything through bignumber.js.
  const bn = BN.isBigNumber(rawValue) ? <BN>rawValue : new BN(rawValue);
  if(bn.isNaN()) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(mustBePositive && bn.isNegative()) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(mustBeInteger && !bn.isInteger()) throw new Error(ERROR_MESSAGE(type, rawValue));
  return bn.toString(10);
}
