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
  FunctionDefinition,
  ModifierInvocation,
} from './ast-node';
import { Artifact } from './artifact';

const nodeSchemaValidator = new Ajv({ allErrors: true });

const isASTNode = nodeSchemaValidator.compile(astNodeSchema);

export function throwIfInvalidNode(node: AnyNode): void {
  if (!isASTNode(node)) {
    throw new Error(util.inspect(node) + ' is not a valid AST node.');
  }
  if (node.nodes) {
    for (const child of node.nodes) {
      throwIfInvalidNode(child);
    }
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

export function isImportDirective(node: Node): node is ImportDirective {
  return node.nodeType === 'ImportDirective';
}

export function isVarDeclaration(node: Node): node is VariableDeclaration {
  return node.nodeType === 'VariableDeclaration';
}

export function isContractType(node: Node): node is ContractDefinition {
  return node.nodeType === 'ContractDefinition';
}

export function isPragmaDirective(node: Node): node is PragmaDirective {
  return node.nodeType === 'PragmaDirective';
}

export function isModifierInvocation(node: Node): node is ModifierInvocation {
  return node.nodeType === 'ModifierInvocation';
}

export function isContractDefinition(node: Node): node is ContractDefinition {
  return node.nodeType === 'ContractDefinition';
}

export function isFunctionDefinition(node: Node): node is FunctionDefinition {
  return node.nodeType === 'FunctionDefinition';
}

export function getSourceIndices(node: Node): [number, number] {
  return node.src
    .split(':')
    .map(val => parseInt(val))
    .slice(0, 2) as [number, number];
}

export function getNodeSources(node: Node, source: string): [number, number, string] {
  const [start, len] = getSourceIndices(node);
  return [start, len, source.slice(start, start + len)];
}

export function getFirstNode<T extends AnyNode>(node: Node, predicate: (node: AnyNode) => node is T): T | null {
  const ret = getNodes(node, predicate);
  return ret.length ? ret[0] : null;
}

export function getNodes<T extends AnyNode>(node: AnyNode, predicate: (node: AnyNode) => node is T): T[] {
  if (!node.nodes) throw new Error('Node has to have nodes defined');
  return node.nodes.filter(predicate);
}

export function getImportDirectives(node: Node): ImportDirective[] {
  return getNodes(node, isImportDirective);
}

export function getPragmaDirectives(node: Node): PragmaDirective[] {
  return getNodes(node, isPragmaDirective);
}

export function getVarDeclarations(node: Node): VariableDeclaration[] {
  return getNodes(node, isVarDeclaration);
}

export function getContracts(node: Node): ContractDefinition[] {
  return getNodes(node, isContractType);
}

export function getConstructor(node: ContractDefinition): FunctionDefinition | null {
  return getFirstNode(
    node,
    (node): node is FunctionDefinition => isFunctionDefinition(node) && node.kind === 'constructor',
  );
}

export function getContract(art: Artifact): ContractDefinition {
  const ret = getFirstNode(
    art.ast,
    (node): node is ContractDefinition => isContractDefinition(node) && node.name === art.contractName,
  );
  if (ret == null) throw new Error(`Can't find ${art.contractName} in ${util.inspect(art)}`);
  return ret;
}

export function getContractById(node: Node, id: number): ContractDefinition | null {
  return getFirstNode(node, (node): node is ContractDefinition => isContractDefinition(node) && node.id === id);
}

export function stripBraces(source: string): string {
  return source.slice(1).slice(0, -1);
}
