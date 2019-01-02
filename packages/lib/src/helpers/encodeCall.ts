/*
 * Utility that wraps around ethereumjs-abi, providing additional validation
 * on passed type/value pair parameters.
 */

import abi from 'ethereumjs-abi';
import * as util from 'ethereumjs-util';
import BN from 'bignumber.js';
import _ from 'lodash';

const ERROR_MESSAGE_PREFIX = 'Encoding error';
const ERROR_MESSAGE = (type: string, value: any) => `${ERROR_MESSAGE_PREFIX} for type ${type} and value ${value.toString()}`;

export default function encodeCall(name: string, types: string[] = [], rawValues: any[] = []): string {
  if(types.length !== rawValues.length) throw new Error(ERROR_MESSAGE_PREFIX + '. Supplied number of types and values do not match.');
  const values =_.zipWith(types, rawValues, parseTypeValuePair);
  const methodId = abi.methodID(name, types).toString('hex');
  const params = abi.rawEncode(types, values).toString('hex');
  return '0x' + methodId + params;
}

export function parseTypeValuePair(type: string, rawValue: any): any | never {
  // Typle type (recurse by calling this function with the individual elements).
  if(/^\(.*\)$/.test(type)) {
    if(typeof rawValue === 'string') rawValue = rawValue.split(',');
    if(rawValue.length === 0) return [];
    const types = type.replace(/[{()}]/g, '').split(','); // Remove the parenthesis and split the tuple into types.
    return _.zipWith(types, rawValue, (typeElement, rawValueElement) => parseTypeValuePair(typeElement, rawValueElement));
  }
  // Array type (also recurse).
  if(/^[^\[]+\[.*\]$/.test(type)) { // Test for '[]' in type.
    if(typeof rawValue === 'string') rawValue = rawValue.split(',');
    if(rawValue.length === 0) return [];
    const size = type.match(/(.*)\[(.*?)\]$/)[2]; // Find number between '[*]'.
    if(size !== '' && parseInt(size, 10) !== rawValue.length) throw new Error(ERROR_MESSAGE(type, rawValue) + '. Invalid array length.');
    const baseType = type.slice(0, type.lastIndexOf('[')); // Remove array part '[*]'.
    return _.map(rawValue, (rawValueElement) => parseTypeValuePair(baseType, rawValueElement));
  }
  // Single type.
  if(type === 'address') return parseAddress(type, rawValue);
  else if(type === 'bool') return parseBool(type, rawValue);
  else if(type === 'string') return parseString(type, rawValue);
  else if(type === 'function') return parseFunction(type, rawValue);
  else if(type.startsWith('bytes')) return parseBytes(type, rawValue);
  else if(type.startsWith('uint')) return parseNumber(type, rawValue, true, true);
  else if(type.startsWith('int')) return parseNumber(type, rawValue, false, true);
  else if(type.startsWith('ufixed')) return parseNumber(type, rawValue, true, false);
  else if(type.startsWith('fixed')) return parseNumber(type, rawValue, false, false);
  else throw new Error(ERROR_MESSAGE(type, rawValue) + '. Unsupported or invalid type.');
}

function parseFunction(type: string, rawValue: string): string | never {
  if(typeof rawValue !== 'string') throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  if(!/^(0x)[0-9a-f]{46}$/i.test(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
  return rawValue;
}

function parseString(type: string, rawValue: string): string | never {
  if(typeof rawValue !== 'string') throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  return rawValue;
}

function parseBool(type: string, rawValue: string | boolean): boolean | never {
  if(typeof rawValue !== 'string' && typeof rawValue !== 'boolean') throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  if(typeof rawValue === 'boolean') return rawValue;
  else if(typeof rawValue === 'string') {
    if(rawValue === 'true') return true;
    else if(rawValue === 'false') return false;
    else throw new Error(ERROR_MESSAGE(type, rawValue));
  }
  throw new Error(ERROR_MESSAGE(type, rawValue));
}

// TODO: Validate data for fixed size byte arrays (bytes1, bytes2, etc).
function parseBytes(type: string, rawValue: string | Buffer): Buffer | never {
  if(typeof rawValue !== 'string' && !Buffer.isBuffer(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  if(Buffer.isBuffer(rawValue)) return rawValue;
  else if(typeof rawValue === 'string') {
    if(rawValue.length === 0) return Buffer.from(''); // Allow buffers from empty strings.
    // Require buffers expressed as strings to be valid hexadecimals.
    if(!/^(0x)[0-9a-f]+$/i.test(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
    const buf = Buffer.from(rawValue.substring(2), 'hex');
    // Test the validity of the buffer.
    if(buf.length === 0) throw new Error(ERROR_MESSAGE(type, rawValue));
    return buf;
  }
}

function parseAddress(type: string, rawValue: string | Buffer): string | never {
  if(typeof rawValue !== 'string' && !Buffer.isBuffer(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  const strAddress = rawValue.toString();
  if(!util.isValidAddress(strAddress)) throw new Error(ERROR_MESSAGE(type, rawValue));
  // If the address' characters are not all uppercase or lowercase, assume that there is checksum to validate.
  if(/[a-f]/.test(strAddress.substring(2)) && /[A-F]/.test(strAddress.substring(2))) {
    if(!util.isValidChecksumAddress(strAddress)) throw new Error(ERROR_MESSAGE(type, rawValue) + '. Checksum error.');
  }
  return strAddress;
}

function parseNumber(type: string, rawValue: number | string | BN, mustBePositive: boolean, mustBeInteger: boolean): string | never {
  if(typeof rawValue !== 'number' && typeof rawValue !== 'string' && !BN.isBigNumber(rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue)); // Runtime type check.
  if(isNaN(<any>rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(typeof rawValue === 'number' && !isFinite(<any>rawValue)) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(typeof rawValue === 'string') rawValue = (<string>rawValue).toLowerCase();
  // Funnel everything through bignumber.js, into a string.
  const bn = BN.isBigNumber(rawValue) ? <BN>rawValue : new BN(rawValue);
  if(bn.isNaN()) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(mustBePositive && bn.isNegative()) throw new Error(ERROR_MESSAGE(type, rawValue));
  if(mustBeInteger && !bn.isInteger()) throw new Error(ERROR_MESSAGE(type, rawValue));
  return bn.toString(10);
}
