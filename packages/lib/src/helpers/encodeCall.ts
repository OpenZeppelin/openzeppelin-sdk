import abi, { ParamType } from 'web3-eth-abi';

export function encodeParams(types: (string | ParamType)[] = [], rawValues: any[] = []): string {
  return abi.encodeParameters(types, rawValues);
}

export default function encodeCall(name: string, types: (string | ParamType)[] = [], rawValues: any[] = []): string {
  const encodedParameters = encodeParams(types, rawValues).substring(2);
  const signatureHash = abi.encodeFunctionSignature(`${name}(${types.join(',')})`).substring(2, 10);
  return `0x${signatureHash}${encodedParameters}`;
}

export function decodeCall(types: (string | ParamType)[] = [], data: string = ''): object {
  return abi.decodeParameters(types, data);
}