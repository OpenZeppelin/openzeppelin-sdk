import encodeCall from '../helpers/encodeCall'
import ContractAST from './ContractAST';

export function buildCallData(contractClass, methodName, args) {
  const method = getFunctionFromMostDerivedContract(contractClass, methodName, args)
  const argTypes = method.inputs.map(input => input.type)
  const callData = encodeCall(methodName, argTypes, args)
  return { method, callData }
}

export function getFunctionFromMostDerivedContract(contractClass, methodName, args) {
  const methodNode = getFunctionNodeFromMostDerivedContract(contractClass, methodName, args);
  const inputs = methodNode.parameters.parameters.map(parameter => {
    const typeString = parameter.typeDescriptions.typeString
    const type = typeString.includes('contract') ? 'address' : typeString
    return { name: parameter.name , type }
  })
  
  const targetMethod = { name: methodName, inputs }
  const matchArgsTypes = fn => fn.inputs.every((input, index) => targetMethod.inputs[index] && targetMethod.inputs[index].type === input.type);
  const matchNameAndArgsLength = fn => fn.name === methodName && fn.inputs.length === args.length;
  
  const abiMethod = 
    contractClass.abi.find(fn => matchNameAndArgsLength(fn) && matchArgsTypes(fn)) ||
    contractClass.abi.find(fn => matchNameAndArgsLength(fn));
  
  if (!abiMethod) throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`)
  return abiMethod;
}

function getFunctionNodeFromMostDerivedContract(contractClass, methodName, args) {
  const ast = new ContractAST(contractClass, null, { nodesFilter: ['ContractDefinition', 'FunctionDefinition'] });
  const nodeMatches = (node) => (
    node.nodeType === 'FunctionDefinition' &&
    node.name === methodName &&
    node.parameters.parameters.length === args.length
  );

  for (const contract of ast.getLinearizedBaseContracts(true)) {
    const funs = contract.nodes.filter(nodeMatches);    
    switch (funs.length) {
      case 0: continue;
      case 1: return funs[0];
      default: throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
    }
  }
  throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`)
}

export function callDescription(method, args) {
  const argsDescriptions = method.inputs.map((input, index) => ` - ${input.name} (${input.type}): ${JSON.stringify(args[index])}`)
  return `${method.name} with: \n${argsDescriptions.join('\n')}`
}