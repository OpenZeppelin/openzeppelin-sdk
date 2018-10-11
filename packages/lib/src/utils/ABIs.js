import encodeCall from '../helpers/encodeCall'
import ContractAST from './ContractAST';

export function buildCallData(contractClass, methodName, args) {
  const method = getABIFunction(contractClass, methodName, args)
  const argTypes = method.inputs.map(input => input.type)
  const callData = encodeCall(method.name, argTypes, args)
  return { method, callData }
}

export function getABIFunction(contractClass, methodName, args) {
  const targetMethod = tryGetTargetFunction(contractClass, methodName, args);
  if (targetMethod) methodName = targetMethod.name;

  const matchArgsTypes = fn => targetMethod && fn.inputs.every((input, index) => targetMethod.inputs[index] && targetMethod.inputs[index].type === input.type);
  const matchNameAndArgsLength = fn => fn.name === methodName && fn.inputs.length === args.length;

  let abiMethods = contractClass.abi.filter(fn => matchNameAndArgsLength(fn) && matchArgsTypes(fn));
  if (abiMethods.length === 0) abiMethods = contractClass.abi.filter(fn => matchNameAndArgsLength(fn));
  
  switch (abiMethods.length) {
    case 0: throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
    case 1: return abiMethods[0];
    default: throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
  }
}

function tryGetTargetFunction(contractClass, methodName, args) {
  // Match foo(uint256,string) as method name, and look for that in the ABI
  const match = methodName.match(/^\s*(.+)\((.*)\)\s*$/)
  if (match) {
    const name = match[1];
    const inputs = match[2].split(',').map(arg => ({ type: arg }));
    return { name, inputs };
  }

  // Otherwise, look for the most derived contract
  const methodNode = tryGetFunctionNodeFromMostDerivedContract(contractClass, methodName, args);
  if (methodNode) {
    const inputs = methodNode.parameters.parameters.map(parameter => {
      const typeString = parameter.typeDescriptions.typeString
      const type = typeString.includes('contract') ? 'address' : typeString
      return { name: parameter.name, type }
    })
    return { name: methodNode.name, inputs }
  }
}

function tryGetFunctionNodeFromMostDerivedContract(contractClass, methodName, args) {
  const linearizedBaseContracts = tryGetLinearizedBaseContracts(contractClass);
  if (!linearizedBaseContracts) return null;

  const nodeMatches = (node) => (
    node.nodeType === 'FunctionDefinition' &&
    node.name === methodName &&
    node.parameters.parameters.length === args.length
  );

  for (const contract of linearizedBaseContracts) {
    const funs = contract.nodes.filter(nodeMatches);    
    switch (funs.length) {
      case 0: continue;
      case 1: return funs[0];
      default: throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
    }
  }
  throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`)
}

function tryGetLinearizedBaseContracts(contractClass) {
  try {
    const ast = new ContractAST(contractClass, null, { nodesFilter: ['ContractDefinition', 'FunctionDefinition'] });
    return ast.getLinearizedBaseContracts(true);
  } catch (err) {
    // This lookup may fail on contracts loaded from libraries, so we just silently fail and fall back to other methods
    return null;
  }
}

export function callDescription(method, args) {
  const argsDescriptions = method.inputs.map((input, index) => ` - ${input.name} (${input.type}): ${JSON.stringify(args[index])}`)
  return `${method.name} with: \n${argsDescriptions.join('\n')}`
}