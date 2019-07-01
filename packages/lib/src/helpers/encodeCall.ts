// TODO: Once we migrate to Web3 1.x, we could replace these two dependencies with Web3, since it uses these two under the hood: https://github.com/ethereum/web3.js/blob/1.0/packages/web3-eth-abi/src/index.js
import { defaultAbiCoder, ParamType } from 'ethers/utils/abi-coder';
import ZWeb3 from '../artifacts/ZWeb3';

export function encodeParams(types: (string | ParamType)[] = [], rawValues: any[] = []): string {
  return defaultAbiCoder.encode(types, rawValues);
}

export default function encodeCall(name: string, types: (string | ParamType)[] = [], rawValues: any[] = []): string {
  const encodedParameters = encodeParams(types, rawValues).substring(2);
  const signatureHash = ZWeb3.sha3(`${name}(${types.join(',')})`).substring(2, 10);
  return `0x${signatureHash}${encodedParameters}`;
}

export function decodeCall(types: (string | ParamType)[] = [], data: any[] = []): any[] {
  return defaultAbiCoder.decode(types, data);
}
