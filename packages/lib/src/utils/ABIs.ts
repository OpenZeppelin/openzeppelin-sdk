import encodeCall from '../helpers/encodeCall';
import ContractAST, { Node } from './ContractAST';
import ContractFactory from '../artifacts/ContractFactory';

interface CalldataInfo {
  method: FunctionInfo;
  callData: string;
}

interface InputInfo {
  name?: string;
  type: string;
}

interface FunctionInfo {
  name: string;
  inputs: InputInfo[];
}

export function buildCallData(contractClass: ContractFactory, methodName: string, args: any[]): CalldataInfo {
  const method = getABIFunction(contractClass, methodName, args);
  const argTypes = method.inputs.map((input) => input.type);
  const callData = encodeCall(method.name, argTypes, args);
  return { method, callData };
}

export function getABIFunction(contractClass: ContractFactory, methodName: string, args: any[]): FunctionInfo {
  const targetMethod: FunctionInfo = tryGetTargetFunction(contractClass, methodName, args);
  if (targetMethod) { methodName = targetMethod.name; }

  const matchArgsTypes = (fn) => targetMethod && fn.inputs.every((input, index) => targetMethod.inputs[index] && targetMethod.inputs[index].type === input.type);
  const matchNameAndArgsLength = (fn) => fn.name === methodName && fn.inputs.length === args.length;

  let abiMethods: FunctionInfo[] = contractClass.abi.filter((fn) => matchNameAndArgsLength(fn) && matchArgsTypes(fn));
  if (abiMethods.length === 0) { abiMethods = contractClass.abi.filter((fn) => matchNameAndArgsLength(fn)); }

  switch (abiMethods.length) {
    case 0: throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
    case 1: return abiMethods[0];
    default: throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
  }
}

function tryGetTargetFunction(contractClass: ContractFactory, methodName: string, args: string[] | undefined): FunctionInfo {
  // Match foo(uint256,string) as method name, and look for that in the ABI
  const match: string[] = methodName.match(/^\s*(.+)\((.*)\)\s*$/);
  if (match) {
    const name = match[1];
    const inputs = match[2].split(',').map((arg) => ({ type: arg }));
    return { name, inputs };
  }

  // Otherwise, look for the most derived contract
  const methodNode: Node = tryGetFunctionNodeFromMostDerivedContract(contractClass, methodName, args);
  if (methodNode) {
    const inputs: any[] = methodNode.parameters.parameters.map((parameter: any) => {
      const typeString: string = parameter.typeDescriptions.typeString;
      const type = typeString.includes('contract') ? 'address' : typeString;
      return { name: parameter.name, type };
    });
    return { name: methodNode.name, inputs };
  }
}

function tryGetFunctionNodeFromMostDerivedContract(contractClass: ContractFactory, methodName: string, args: any[]): Node | null {
  const linearizedBaseContracts: Node[] | null = tryGetLinearizedBaseContracts(contractClass);
  if (!linearizedBaseContracts) { return null; }

  const nodeMatches = (node: Node) => (
    node.nodeType === 'FunctionDefinition' &&
    node.name === methodName &&
    node.parameters.parameters.length === args.length
  );

  for (const contract of linearizedBaseContracts) {
    const funs: Node[] = contract.nodes.filter(nodeMatches);
    switch (funs.length) {
      case 0: continue;
      case 1: return funs[0];
      default: throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
    }
  }
  throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contractClass.contractName}`);
}

function tryGetLinearizedBaseContracts(contractClass: ContractFactory): Node[] | null {
  try {
    const ast: ContractAST = new ContractAST(contractClass, null, { nodesFilter: ['ContractDefinition', 'FunctionDefinition'] });
    return ast.getLinearizedBaseContracts(true);
  } catch (err) {
    // This lookup may fail on contracts loaded from libraries, so we just silently fail and fall back to other methods
    return null;
  }
}

export function callDescription(method: any, args: string[]): string {
  const argsDescriptions: any = method.inputs.map((input: any, index: number) => ` - ${input.name} (${input.type}): ${JSON.stringify(args[index])}`);
  return `${method.name} with: \n${argsDescriptions.join('\n')}`;
}

export default {
  buildCallData,
  getABIFunction,
  callDescription,
};
