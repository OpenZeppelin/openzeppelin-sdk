import encodeCall from '../helpers/encodeCall'

export function buildCallData(contractClass, methodName, args) {
  const method = getFunction(contractClass, methodName, args)
  const argTypes = method.inputs.map(input => input.type)
  const callData = encodeCall(methodName, argTypes, args)
  return { method, callData }
}

export function getFunction(contractClass, methodName, args) {
  const method = contractClass.abi.find(fn => fn.name === methodName && fn.inputs.length === args.length)
  if (!method) throw Error(`Could not find method '${methodName}' with ${args.length} arguments in contract class`)
  return method
}

export function callDescription(method, args) {
  const argsDescriptions = method.inputs.map((input, index) => ` - ${input.name} (${input.type}): ${JSON.stringify(args[index])}`)
  return `${method.name} with: \n${argsDescriptions.join('\n')}`
}