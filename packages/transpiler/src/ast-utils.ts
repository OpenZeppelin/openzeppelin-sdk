import find from 'lodash.find';
import Ajv from 'ajv';
import util from 'util';
import astNodeSchema from './schemas/ast-node';

const nodeSchemaValidator = new Ajv({ allErrors: true });

export type NodeType =
  | 'SourceUnit'
  | 'ImportDirective'
  | 'VariableDeclaration'
  | 'ContractDefinition'
  | 'ModifierInvocation'
  | 'FunctionDefinition'
  | 'EventDefinition'
  | 'ModifierDefinition'
  | 'PragmaDirective';

export interface Node {
  id: number;
  nodeType: NodeType;
  src: string;
  nodes?: AnyNode[];
}

export interface SourceUnit extends Node {
  nodeType: 'SourceUnit';
}

export type ContractKind = 'contract' | 'interface';

export interface ContractDefinition extends Node {
  nodeType: 'ContractDefinition';
  id: number;
  name: string;
  documentation: string | null;
  linearizedBaseContracts: number[];
  contractKind: ContractKind;
}

export interface VariableDeclaration extends Node {
  nodeType: 'VariableDeclaration';
  visibility: 'internal' | 'public' | 'private';
  name: string;
  constant: boolean;
  typeName: TypeName;
}

export interface FunctionDefinition extends Node {
  nodeType: 'FunctionDefinition';
  kind: 'function' | 'constructor' | 'fallback';
  visibility: 'internal' | 'external' | 'public' | 'private';
  name: string;
  documentation: string | null;
  parameters: ParameterList;
  returnParameters: ParameterList;
}

export interface EventDefinition extends Node {
  nodeType: 'EventDefinition';
  name: string;
  documentation: string | null;
  parameters: ParameterList;
}

export interface ModifierDefinition extends Node {
  nodeType: 'ModifierDefinition';
  name: string;
  documentation: string | null;
  parameters: ParameterList;
}

export interface ParameterList {
  parameters: {
    name: string;
    typeName: TypeName;
  }[];
}

export interface TypeName {
  nodeType: 'ElementaryTypeName' | 'UserDefinedTypeName';
  typeDescriptions: {
    typeString: string;
  };
}

export type AnyNode = Node | VariableDeclaration | FunctionDefinition | EventDefinition | ModifierDefinition;

const isASTNode = nodeSchemaValidator.compile(astNodeSchema);

function throwIfInvalidNode(node: AnyNode) {
  if (!isASTNode(node)) {
    throw new Error(util.inspect(node) + ' is not a valid AST node.');
  }
}

function isContractKind(node: ContractDefinition, kind: ContractKind) {
  return node.contractKind === kind;
}

function isInterface(node: ContractDefinition) {
  return isContractKind(node, 'interface');
}

function isContract(node: ContractDefinition) {
  return isContractKind(node, 'contract');
}

function isNodeType(node: Node, name: NodeType) {
  return node.nodeType === name;
}

function isImportDirective(node: Node) {
  return isNodeType(node, 'ImportDirective');
}

function isVarDeclaration(node: Node) {
  return isNodeType(node, 'VariableDeclaration');
}

function isContractType(node: Node) {
  return isNodeType(node, 'ContractDefinition');
}

function isPragmaDirective(node: Node) {
  return isNodeType(node, 'PragmaDirective');
}

function idModifierInvocation(node: Node) {
  return isNodeType(node, 'ModifierInvocation');
}

function getSourceIndices(node: Node) {
  return node.src
    .split(':')
    .map(val => parseInt(val))
    .slice(0, 2);
}

function getNodeSources(node: Node, source: string) {
  const [start, len] = getSourceIndices(node);
  return [start, len, source.slice(start, start + len)];
}

function getNode(node: Node, predicate: (node: AnyNode) => boolean) {
  return find(node.nodes, predicate);
}

function getNodes(node: Node, predicate: (node: AnyNode) => boolean) {
  return node.nodes && node.nodes.filter(predicate);
}

function getImportDirectives(node: Node) {
  return getNodes(node, isImportDirective);
}

function getPragmaDirectives(node: Node) {
  return getNodes(node, isPragmaDirective);
}

function getVarDeclarations(node: Node) {
  return getNodes(node, isVarDeclaration);
}

function getContracts(node: Node) {
  return getNodes(node, isContractType);
}

function getConstructor(node: FunctionDefinition) {
  return getNode(node, node => (node as FunctionDefinition).kind === 'constructor');
}

function getContract(node: ContractDefinition, contractName: string) {
  return getNode(node, node => (node as ContractDefinition).name === contractName);
}

function getContractById(node: Node, id: number) {
  return getNode(node, node => node.id === id);
}

module.exports = {
  isASTNode,
  getNode,
  getConstructor,
  getContract,
  getContractById,
  getSourceIndices,
  getNodeSources,
  isPragmaDirective,
  isImportDirective,
  getImportDirectives,
  getPragmaDirectives,
  getVarDeclarations,
  getContracts,
  idModifierInvocation,
  isContract,
  isInterface,
  throwIfInvalidNode,
};
