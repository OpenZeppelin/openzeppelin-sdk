import _ from 'lodash';
import { getBuildArtifacts } from "./BuildArtifacts";

// REFACTOR: Reuse in Storage.js
export default class ContractAST {
  constructor(contract, artifacts = undefined, { nodesFilter } = {}) {
    this.artifacts = artifacts || getBuildArtifacts();
    this.contract = contract
    this.imports = new Set() // Transitive closure of source files imported from the contract
    this.nodes = {} // Map from ast id to nodeset across all visited contracts (note that more than one node may have the same id, due to how truffle compiles artifacts)
    this.nodesFilter = nodesFilter // Node types to collect, null for all

    this._collectImports(this.contract.ast)
    this._collectNodes(this.contract.ast)
  }

  getContractNode() {
    return this.contract.ast.nodes.find(node => 
      node.nodeType === 'ContractDefinition' && 
      node.name === this.contract.contractName
    )
  }

  getLinearizedBaseContracts(mostDerivedFirst = false) {
    const contracts = this.getContractNode().linearizedBaseContracts.map(id => this.getNode(id, 'ContractDefinition'));
    return mostDerivedFirst ? contracts : _.reverse(contracts);
  }

  getNode(id, type) {
    if (!this.nodes[id]) throw Error(`No AST nodes with id ${id} found`)
    const candidates = this.nodes[id].filter(node => node.nodeType === type)
    switch (candidates.length) {
      case 0: throw Error(`No AST nodes of type ${type} with id ${id} found (got ${this.nodes[id].map(node => node.nodeType).join(', ')})`);
      case 1: return candidates[0];
      default: throw Error(`Found more than one node of type ${type} with the same id ${id}. Please try clearing your build artifacts and recompiling your contracts.`);
    }
  }

  _collectImports(ast) {
    ast.nodes
      .filter(node => node.nodeType === 'ImportDirective')
      .map(node => node.absolutePath)
      .forEach(importPath => {
        if (this.imports.has(importPath)) return;
        this.imports.add(importPath);
        console.log(`Adding ${importPath}`)
        this.artifacts.getArtifactsFromSourcePath(importPath).forEach(importedArtifact => {
          this._collectNodes(importedArtifact.ast)
          this._collectImports(importedArtifact.ast)
        })
      })
  }

  _collectNodes(node) {
    // Return if we have already seen this node
    if (_.some(this.nodes[node.id] || [], n => _.isEqual(n, node))) return; 
    // Only process nodes of the filtered types (or SourceUnits)
    if (node.nodeType !== 'SourceUnit' && this.nodesFilter && !_.includes(this.nodesFilter, node.nodeType)) return;
    // Add node to collection with this id otherwise
    if (!this.nodes[node.id]) this.nodes[node.id] = [];
    this.nodes[node.id].push(node);
    // Call recursively to children
    if (node.nodes) node.nodes.forEach(this._collectNodes.bind(this));
  }
}