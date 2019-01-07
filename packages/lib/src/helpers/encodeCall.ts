// TODO: Once we migrate to Web3 1.x, we could replace these two dependencies with Web3, since it uses these two under the hood: https://github.com/ethereum/web3.js/blob/1.0/packages/web3-eth-abi/src/index.js
import { defaultAbiCoder, ParamType } from 'ethers/utils/abi-coder';
import { sha3 } from 'web3-utils';
import _ from 'lodash';

export default function encodeCall(name: string, types: Array<string | ParamType> = [], rawValues: any[] = []): string {
  const values = _.zipWith(types, rawValues, parseValueTypePair);
  const encodedParameters = defaultAbiCoder.encode(types, values).substring(2);
  const signatureHash = sha3(`${name}(${types.join(',')})`).substring(2, 10);
  return `0x${signatureHash}${encodedParameters}`;
}

export function decodeCall(types: Array<string | ParamType> = [], data: any[] = []): any[] {
  return defaultAbiCoder.decode(types, data);
}

function parseValueTypePair(type: string, rawValue: any): any {
  if(type === 'bool') return parseBool(type, rawValue);
  return rawValue;
}

function parseBool(type: string, rawValue: string | boolean): boolean {
  if(typeof rawValue !== 'string' && typeof rawValue !== 'boolean') throw new Error(`Invalid bool value: ${rawValue}`);
  if(typeof rawValue === 'boolean') return rawValue;
  else if(typeof rawValue === 'string') {
    if(rawValue.toLowerCase() === 'true') return true;
    else if(rawValue.toLowerCase() === 'false') return false;
    else throw new Error(`Invalid bool value: ${rawValue}`);
  }
}
