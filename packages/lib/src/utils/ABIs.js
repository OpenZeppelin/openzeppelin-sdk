import encodeCall from '../helpers/encodeCall'

export function buildCallData(contractClass, methodName, args) {
  const method = getFunction(contractClass, methodName, args)
  const argTypes = method.inputs.map(input => input.type)
  const callData = encodeCall(methodName, argTypes, args)
  return { method, callData }
}

export function getFunction(contractClass, methodName, args) {
  const baseMethod = findFunctionInBaseContract(contractClass, methodName)
  const matchArgsTypes = fn => fn.inputs.every((input, index) => baseMethod.inputs[index] && baseMethod.inputs[index].type === input.type)
  const matchNameAndArgsLength = fn => fn.name === methodName && fn.inputs.length === args.length
  let method
  if (baseMethod) method = contractClass.abi.find(fn => matchNameAndArgsLength(fn) && matchArgsTypes(fn))
  if (!method) method = contractClass.abi.find(fn => matchNameAndArgsLength(fn))
  if (!method) throw Error(`Could not find method '${methodName}' with ${args.length} arguments in contract class`)
  return method
}

export function findFunctionInBaseContract(contractClass, methodName) {
  const astContractNode = contractClass.ast.nodes.find(node => node.name === contractClass.contractName)
  const initMethodNode = astContractNode.nodes.find(node => node.nodeType === "FunctionDefinition" && node.name === methodName)
  if (initMethodNode) {
    const parameters = initMethodNode.parameters.parameters
    const inputs = parameters.map(parameter => {
      const typeString = parameter.typeDescriptions.typeString
      const type = typeString.includes('contract') ? 'address' : typeString
      return { name: parameter.name , type }
    })
    return { name: methodName, inputs }
  }
}

export function callDescription(method, args) {
  const argsDescriptions = method.inputs.map((input, index) => ` - ${input.name} (${input.type}): ${JSON.stringify(args[index])}`)
  return `${method.name} with: \n${argsDescriptions.join('\n')}`
}