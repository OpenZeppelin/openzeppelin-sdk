const abi = require('ethereumjs-abi')

function encodeCall(name, arguments = [], rawValues = []) {
  const values = rawValues.map(value => value.toString()) // convert BigNumbers to string
  const methodId = abi.methodID(name, arguments).toString('hex');
  const params = abi.rawEncode(arguments, values).toString('hex');
  return '0x' + methodId + params;
}

module.exports = encodeCall;
