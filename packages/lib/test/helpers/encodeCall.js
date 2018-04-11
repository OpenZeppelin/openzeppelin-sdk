const abi = require('ethereumjs-abi')

function encodeCall(name, arguments = [], values = []) {
  const methodId = abi.methodID(name, arguments).toString('hex');
  const params = abi.rawEncode(arguments, values).toString('hex');
  return '0x' + methodId + params;
}

module.exports = encodeCall;