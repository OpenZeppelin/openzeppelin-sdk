import find from 'lodash.find';
import Ajv from 'ajv';
import util from 'util';
import astNodeSchema from './schemas/ast-node';

let nodeSchemaValidator = new Ajv({ allErrors: true });

/**
 * Check if given argument is an AST Node
 * @param {Object} possibleObject Argument to check for validity
 * @returns {Boolean} isAValidASTNode true if given argument is an AST node, false otherwise
 */
const isASTNode = nodeSchemaValidator.compile(astNodeSchema);

// For internal use. Throws if is passed an invalid AST node, else does nothing.
function throwIfInvalidNode(node) {
  if (!isASTNode(node)) {
    throw new Error(util.inspect(node) + ' is not a valid AST node.');
  }
}

function isContractKind(node, kind) {
  throwIfInvalidNode(node);
  return node['contractKind'] === kind;
}

function isInterface(node) {
  return isContractKind(node, 'interface');
}

function isInterface(node) {
  return isContractKind(node, 'interface');
}

function isContract(node) {
  return isContractKind(node, 'contract');
}

/**
 * @param {Object} node The node to check
 * @param {String} name The type of the node
 * @returns {Boolean} true if the given node is the right type
 */
function isNodeType(node, name) {
  throwIfInvalidNode(node);
  return node['nodeType'] === name;
}

function isImportDirective(node) {
  return isNodeType(node, 'ImportDirective');
}

function isVarDeclaration(node) {
  return isNodeType(node, 'VariableDeclaration');
}

function isContractType(node) {
  return isNodeType(node, 'ContractDefinition');
}

function isPragmaDirective(node) {
  return isNodeType(node, 'PragmaDirective');
}

function idModifierInvocation(node) {
  return isNodeType(node, 'ModifierInvocation');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an BlockStatement
 */
function isBlockStatement(node) {
  return isNodeType(node, 'BlockStatement');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an BreakStatement
 */
function isBreakStatement(node) {
  return isNodeType(node, 'BreakStatement');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an ExpressionStatement
 */
function isExpression(node) {
  return isNodeType(node, 'ExpressionStatement');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an AssignmentStatement
 */
function isAssignment(node) {
  return isNodeType(node, 'AssignmentExpression');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an UpdateExpression
 */
function isUpdate(node) {
  return isNodeType(node, 'UpdateExpression');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an MemberExpression
 */
function isMember(node) {
  return isNodeType(node, 'MemberExpression');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is an IfStatement
 */
function isIfStatement(node) {
  return isNodeType(node, 'IfStatement');
}

/**
 * @param {Object} node The node to check
 * @returns {Boolean} true if the given node is a type of loop statement
 */
function isLoopStatement(node) {
  return ['ForStatement', 'WhileStatement', 'DoWhileStatement'].indexOf(node['type']) >= 0;
}

/**
 * Determine whether a given node is a child of another given node
 * @param {Object} potentialChild AST Node to be tested for child
 * @param {Object} potentialParent AST Node to be tested for parent
 * @returns {Bool} true if potentialChild is indeed a child of potentialParent, false otherwise
 */
function isAChildOf(potentialChild, potentialParent) {
  throwIfInvalidNode(potentialChild);
  throwIfInvalidNode(potentialParen);

  // Note that if the start or end pos of both nodes is same,
  // then they're considered to be the same node and DON'T have parent-child relationship.
  return potentialChild.start > potentialParent.start && potentialChild.end < potentialParent.end;
}

function getSourceIndices(node) {
  return node.src
    .split(':')
    .map(val => parseInt(val))
    .slice(0, 2);
}

function getNodeSources(node, source) {
  const [start, len] = getSourceIndices(node);
  return [start, len, source.slice(start, start + len)];
}

/**
 * Search for the node to satisfy a specified predicate
 * @param {Object} node The AST Node to start search from
 * @returns {Object} nodeResult Result of the search
 */
function getNode(node, predicate) {
  throwIfInvalidNode(node);
  return find(node.nodes, predicate);
}

function getNodes(node, predicate) {
  throwIfInvalidNode(node);
  return node.nodes.filter(predicate);
}

function getImportDirectives(node) {
  return getNodes(node, isImportDirective);
}

function getPragmaDirectives(node) {
  return getNodes(node, isPragmaDirective);
}

function getVarDeclarations(node) {
  return getNodes(node, isVarDeclaration);
}

function getContracts(node) {
  return getNodes(node, isContractType);
}

/**
 * Search for the constructor node
 * @param {Object} node The AST Node to start search from
 * @returns {Object} nodeResult Result of the search
 */
function getConstructor(node) {
  return getNode(node, ['kind', 'constructor']);
}

/**
 * Search for the contract node by name
 * @param {Object} node The AST Node to start search from
 * @returns {Object} nodeResult Result of the search
 */
function getContract(node, contractName) {
  return getNode(node, ['name', contractName]);
}

function getContractById(node, id) {
  return getNode(node, ['id', id]);
}

/**
 * Get the parent node of the specified node
 * @param {Object} node The AST Node to retrieve the parent of
 * @returns {Object} nodeParent Parent node of the given node
 */
function getParent(node) {
  throwIfInvalidNode(node);
  return node.parent;
}

/**
 * Retrieve the line number on which the code for provided node STARTS
 * @param {Object} node The AST Node to retrieve the line number of
 * @returns {Integer} lineNumber Line number of code of the specified node. (LINES BEGIN FROM 1)
 */
function getLine(node, sourceCodeText) {
  throwIfInvalidNode(node, 'getLine');

  let newLineCharsBefore = sourceCodeText.slice(0, node.start).match(/\n/g);

  return (newLineCharsBefore ? newLineCharsBefore.length : 0) + 1;
}

/**
 * Retrieve the column number of the first character of the given node
 * @param {Object} node The AST Node to retrieve the column number of
 * @returns {Integer} columnNumber Column number of code of the specified node (COLUMNS BEGIN FROM 0)
 */
function getColumn(node, sourceCodeText) {
  throwIfInvalidNode(node);

  //start looking from sourceCodeText [node.start] and stop upon encountering the first linebreak character
  for (let i = node.start; i >= 0; i--) {
    if (sourceCodeText[i] === '\n') {
      return node.start - i - 1;
    }
  }

  return node.start;
}

/**
 * Retrieve the line number on which the code for provided node ENDS
 * @param {Object} node The AST Node to retrieve the line number of
 * @returns {int} lineNumber Line number of code ending of the specified node. (LINES BEGIN FROM 1)
 */
function getEndingLine(node, sourceCodeText) {
  throwIfInvalidNode(node);

  let newLineCharsBefore = sourceCodeText.slice(0, node.end).match(/\n/g);

  return (newLineCharsBefore ? newLineCharsBefore.length : 0) + 1;
}

/**
 * Retrieve the column number of the last character that is part of the given node
 * @param {Object} node The AST Node to retrieve the ending column number of
 * @returns {Integer} columnNumber Column number of last char of the specified node (COLUMNS BEGIN FROM 0)
 */
function getEndingColumn(node, sourceCodeText) {
  throwIfInvalidNode(node);

  //start looking from 1 character before node.start and stop upon encountering the first linebreak character
  for (let i = node.end - 1; i >= 0; i--) {
    if (sourceCodeText[i] === '\n') {
      return node.end - i - 2;
    }
  }

  return node.end - 1;
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
};
