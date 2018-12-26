import abi from 'ethereumjs-abi';
import BN from 'bignumber.js';

export function formatValue(value: any): string | void {

  // Numbers.
  if(typeof(value) === 'number') {
    if(value % 1 === 0) return value.toString(10);
    else throw new Error('Floating point numbers are not supported on parameter encoding.');
  }

  // Big numbers.
  if(BN.isBigNumber(value)) return value.toString();

  // Strings.
  if(typeof(value) === 'string') {
    const hasHexRadix = value.indexOf('0x') !== -1 || value.indexOf('0X') !== -1;

    // Numeric strings with exponents, e.g. '1.5e9'.
    if(!hasHexRadix && value.match(/\d+(\.\d+)?e(\+)?\d+/)) {
      return (new BN(value)).toString(10);
    }
  }

  // Something else.
  return value;
}

export default function encodeCall(name: string, args: string[] = [], rawValues: any[] = []): string {
  const values: string[] = <string[]>rawValues.map(formatValue);
  const methodId: string = abi.methodID(name, args).toString('hex');
  // TODO: verify that each type-value pair is valid.
  const params: Buffer = abi.rawEncode(args, values).toString('hex');
  return '0x' + methodId + params;
}
