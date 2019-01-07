// TODO: Once we migrate to Web3 1.x, we could replace these two dependencies with Web3, since it uses these two under the hood: https://github.com/ethereum/web3.js/blob/1.0/packages/web3-eth-abi/src/index.js
import { defaultAbiCoder, ParamType } from 'ethers/utils/abi-coder';
import ZWeb3 from '../artifacts/ZWeb3';
import _ from 'lodash';

export default function encodeCall(name: string, types: Array<string | ParamType> = [], rawValues: any[] = [], parseValues: boolean = false): string {
  const values = parseValues ? _.map(rawValues, parseValue) : rawValues;
  const encodedParameters = defaultAbiCoder.encode(types, values).substring(2);
  const signatureHash = ZWeb3.sha3(`${name}(${types.join(',')})`).substring(2, 10);
  return `0x${signatureHash}${encodedParameters}`;
}

export function decodeCall(types: Array<string | ParamType> = [], data: any[] = []): any[] {
  return defaultAbiCoder.decode(types, data);
}

function parseValue(rawValue: any): any {
  if(Array.isArray(rawValue)) return _.map(rawValue, parseValue);
  if(typeof rawValue === 'string') {
    if(rawValue.toLowerCase() === 'true' || rawValue.toLowerCase() === 'false') return parseBool(rawValue);
  }
  return rawValue;
}

function parseBool(rawValue: string): boolean {
  if(typeof rawValue !== 'string') throw new Error(`Invalid bool value: ${rawValue}`);
  if(rawValue.toLowerCase() === 'true') return true;
  else if(rawValue.toLowerCase() === 'false') return false;
  else throw new Error(`Invalid bool value: ${rawValue}`);
}
