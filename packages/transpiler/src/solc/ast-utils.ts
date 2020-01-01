import find from 'lodash.find';
import Ajv from 'ajv';
import util from 'util';
import astNodeSchema from './schemas/ast';
import {
  AnyNode,
  Node,
  ContractKind,
  ContractDefinition,
  ImportDirective,
  NodeType,
  FunctionDefinition,
  SourceUnit,
} from './ast-node';

const nodeSchemaValidator = new Ajv({ allErrors: true });

const isASTNode = nodeSchemaValidator.compile(astNodeSchema);

export function throwIfInvalidNode(node: AnyNode) {
  if (!isASTNode(node)) {
    throw new Error(util.inspect(node) + ' is not a valid AST node.');
  }
}

export function isContractKind(node: ContractDefinition, kind: ContractKind) {
  return node.contractKind === kind;
}

export function isInterface(node: ContractDefinition) {
  return isContractKind(node, 'interface');
}

export function isContract(node: ContractDefinition) {
  return isContractKind(node, 'contract');
}

export function isNodeType(node: Node, name: NodeType) {
  return node.nodeType === name;
}

export function isImportDirective(node: Node) {
  return isNodeType(node, 'ImportDirective');
}

export function isVarDeclaration(node: Node) {
  return isNodeType(node, 'VariableDeclaration');
}

export function isContractType(node: Node) {
  return isNodeType(node, 'ContractDefinition');
}

export function isPragmaDirective(node: Node) {
  return isNodeType(node, 'PragmaDirective');
}

export function idModifierInvocation(node: Node) {
  return isNodeType(node, 'ModifierInvocation');
}

export function getSourceIndices(node: Node) {
  return node.src
    .split(':')
    .map(val => parseInt(val))
    .slice(0, 2);
}

export function getNodeSources(node: Node, source: string): [number, number, string] {
  const [start, len] = getSourceIndices(node);
  return [start, len, source.slice(start, start + len)];
}

export function getNode(node: Node, predicate: (node: Node) => boolean) {
  return find(node.nodes, predicate);
}

export function getNodes(node: Node, predicate: (node: AnyNode) => boolean) {
  if (!node.nodes) throw new Error('Node has to have nodes defined');
  return node.nodes.filter(predicate);
}

export function getImportDirectives(node: Node) {
  return getNodes(node, isImportDirective) as ImportDirective[];
}

export function getPragmaDirectives(node: Node) {
  return getNodes(node, isPragmaDirective);
}

export function getVarDeclarations(node: Node) {
  return getNodes(node, isVarDeclaration);
}

export function getContracts(node: Node) {
  return getNodes(node, isContractType) as ContractDefinition[];
}

export function getConstructor(node: ContractDefinition) {
  return getNode(node, node => (node as FunctionDefinition).kind === 'constructor') as FunctionDefinition | undefined;
}

export function getContract(node: SourceUnit, contractName: string): ContractDefinition | undefined {
  return getNode(node, node => (node as ContractDefinition).name === contractName) as ContractDefinition | undefined;
}

export function getContractById(node: Node, id: number) {
  return getNode(node, node => node.id === id);
}
