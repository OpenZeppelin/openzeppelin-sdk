import Ajv from 'ajv';
import util from 'util';
import astNodeSchema from './schemas/ast';
import {
  AnyNode,
  Node,
  ContractKind,
  ContractDefinition,
  ImportDirective,
  PragmaDirective,
  VariableDeclaration,
  NodeType,
  FunctionDefinition,
  SourceUnit,
} from './ast-node';

const nodeSchemaValidator = new Ajv({ allErrors: true });

const isASTNode = nodeSchemaValidator.compile(astNodeSchema);

export function throwIfInvalidNode(node: AnyNode): void {
  if (!isASTNode(node)) {
    throw new Error(util.inspect(node) + ' is not a valid AST node.');
  }
}

export function isContractKind(node: ContractDefinition, kind: ContractKind): boolean {
  return node.contractKind === kind;
}

export function isInterface(node: ContractDefinition): boolean {
  return isContractKind(node, 'interface');
}

export function isContract(node: ContractDefinition): boolean {
  return isContractKind(node, 'contract');
}

export function isNodeType(node: Node, name: NodeType): boolean {
  return node.nodeType === name;
}

export function isImportDirective(node: Node): boolean {
  return isNodeType(node, 'ImportDirective');
}

export function isVarDeclaration(node: Node): boolean {
  return isNodeType(node, 'VariableDeclaration');
}

export function isContractType(node: Node): boolean {
  return isNodeType(node, 'ContractDefinition');
}

export function isPragmaDirective(node: Node): boolean {
  return isNodeType(node, 'PragmaDirective');
}

export function idModifierInvocation(node: Node): boolean {
  return isNodeType(node, 'ModifierInvocation');
}

export function getSourceIndices(node: Node): number[] {
  return node.src
    .split(':')
    .map(val => parseInt(val))
    .slice(0, 2);
}

export function getNodeSources(node: Node, source: string): [number, number, string] {
  const [start, len] = getSourceIndices(node);
  return [start, len, source.slice(start, start + len)];
}

export function getNode(node: Node, predicate: (node: AnyNode) => boolean): AnyNode | null {
  const ret = getNodes(node, predicate);
  return ret.length ? ret[0] : null;
}

export function getNodes(node: Node, predicate: (node: AnyNode) => boolean): AnyNode[] {
  if (!node.nodes) throw new Error('Node has to have nodes defined');
  return node.nodes.filter(predicate);
}

export function getImportDirectives(node: Node): ImportDirective[] {
  return getNodes(node, isImportDirective) as ImportDirective[];
}

export function getPragmaDirectives(node: Node): PragmaDirective[] {
  return getNodes(node, isPragmaDirective) as PragmaDirective[];
}

export function getVarDeclarations(node: Node): VariableDeclaration[] {
  return getNodes(node, isVarDeclaration) as VariableDeclaration[];
}

export function getContracts(node: Node): ContractDefinition[] {
  return getNodes(node, isContractType) as ContractDefinition[];
}

export function getConstructor(node: ContractDefinition): FunctionDefinition | null {
  return getNode(node, node => (node as FunctionDefinition).kind === 'constructor') as FunctionDefinition | null;
}

export function getContract(node: SourceUnit, contractName: string): ContractDefinition | null {
  return getNode(node, node => (node as ContractDefinition).name === contractName) as ContractDefinition | null;
}

export function getContractById(node: Node, id: number): ContractDefinition | null {
  return getNode(node, node => node.id === id) as ContractDefinition | null;
}
