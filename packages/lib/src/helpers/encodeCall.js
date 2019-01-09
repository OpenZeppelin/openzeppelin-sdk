import abi from 'ethereumjs-abi'
import BN from 'bignumber.js'

export const SCIENTIFIC_NOTATION_PATTERN = /^\s*[-]?\d+(\.\d+)?e(\+)?\d+\s*$/

export default function encodeCall(name, args = [], rawValues = []) {
  const values = rawValues.map(formatValue)
  const methodId = abi.methodID(name, args).toString('hex');
  const params = abi.rawEncode(args, values).toString('hex');
  return '0x' + methodId + params;
}

export function decodeCall(types, data) {
  if (typeof data === 'string') data = new Buffer(data, 'hex')
  const values = abi.rawDecode(types, data)

  types.filter(type => type.startsWith('address')).forEach((type, index) => {
    if (typeof values[index] === 'string') values[index] = `0x${values[index]}`
    else values[index] = values[index].map(value => `0x${value}`)
  })

  return values
}

function formatValue(value) {
  if (BN.isBigNumber(value)) return value.toString(10)
  if (typeof(value) === 'number') return value.toString()
  if (typeof(value) === 'string' && value.match(SCIENTIFIC_NOTATION_PATTERN)) return new BN(value).toString(10)
  return value
}
