import abi from 'ethereumjs-abi';
import BN from 'bignumber.js';

function formatValue(value: any): string {
  if (typeof(value) === 'number' || BN.isBigNumber(value)) {
    return value.toString();
  } else if (typeof(value) === 'string' && value.match(/\d+(\.\d+)?e(\+)?\d+/)) {
    return (new BN(value)).toString(10);
  } else {
    return value;
  }
}

export default function encodeCall(name: string, args: string[] = [], rawValues: any[] = []): string {
  const values: string[] = rawValues.map(formatValue);
  const methodId: string = abi.methodID(name, args).toString('hex');
  const params: Buffer = abi.rawEncode(args, values).toString('hex');
  return '0x' + methodId + params;
}
