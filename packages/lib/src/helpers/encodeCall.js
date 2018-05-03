import abi from 'ethereumjs-abi'

export default function encodeCall(name, args = [], rawValues = []) {
  const values = rawValues.map(value => value.toString()) // convert BigNumbers to string
  const methodId = abi.methodID(name, args).toString('hex');
  const params = abi.rawEncode(args, values).toString('hex');
  return '0x' + methodId + params;
}
