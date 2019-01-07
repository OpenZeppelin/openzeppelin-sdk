// TODO: Once we migrate to Web3 1.x, we could replace these two dependencies with Web3, since it uses these two under the hood: https://github.com/ethereum/web3.js/blob/1.0/packages/web3-eth-abi/src/index.js
import { defaultAbiCoder, ParamType } from 'ethers/utils/abi-coder';
import { sha3 } from 'web3-utils';

export default function encodeCall(name: string, types: Array<string | ParamType> = [], rawValues: any[] = []): string {
  const encodedParameters = defaultAbiCoder.encode(types, rawValues).substring(2);
  const signatureHash = sha3(`${name}(${types.join(',')})`).substring(2, 10);
  return `0x${signatureHash}${encodedParameters}`;
}
