import { some, reverse, includes, isEqual, pick, flatten } from 'lodash';

import { getBuildArtifacts, BuildArtifacts } from '../artifacts/BuildArtifacts';
import Contract from '../artifacts/Contract';

// TS-TODO: Many of the interfaces defined here come from Solidity's AST output schema.
// cli has Solidity schema definitions in @types/solc.d.ts. If such file was moved to the lib
// package, these interfaces would not be needed, and all the AST definitions could live within solc.d.ts.

// TS-TODO: define Node type.
export type Node = any;

export interface NodeMapping {
  [id: number]: Node[];
}

export interface TypeInfo {
  id: string;
  kind: string;
  label: string;
  valueType?: string;
  length?: number;
  members?: StorageInfo[];
  src?: any;
}

export interface TypeInfoMapping {
  [id: string]: TypeInfo;
}

export interface StorageInfo {
  label: string;
  astId: number;
  type: any;
  src: string;
  path?: string;
  contract?: string;
}

interface ContractASTProps {
  nodesFilter?: string[];
}

export const ContractDefinitionFilter = {
  nodesFilter: ['ContractDefinition'],
};

export const FunctionDefinitionFilter = {
  nodesFilter: ['ContractDefinition', 'FunctionDefinition'],
};

class NodeNotFoundError extends Error {
  public constructor(id, type) {
    super(`No AST nodes of type ${type} with id ${id} found.`);
  }
}

class MultipleNodesFoundError extends Error {
  public constructor(id, type) {
    super(
      `Found more than one node of type ${type} with the same id ${id}. Try clearing your build artifacts and recompiling your contracts.`,
    );
  }
}

export default class ContractAST {
  private artifacts: BuildArtifacts;
  private contract: Contract;
  private imports: Set<string>;
  private nodes: NodeMapping;
  private types: TypeInfoMapping;
  private nodesFilter: string[];

  public constructor(contract: Contract, artifacts?: BuildArtifacts, props: ContractASTProps = {}) {
    const { directory } = contract.schema;
    this.artifacts = artifacts || getBuildArtifacts(directory);
    this.contract = contract;

    // Transitive closure of source files imported from the contract.
    this.imports = new Set();

    // Map from ast id to nodeset across all visited contracts.
    // (Note that more than one node may have the same id, due to how truffle compiles artifacts).
    this.nodes = {};

    // Types info being collected for the current contract.
    this.types = {};

    // Node types to collect, null for all
    this.nodesFilter = props.nodesFilter;

    this._collectImports(this.contract.schema.ast);
    this._collectNodes(this.contract.schema.ast);
  }

  public getContractNode(): Node {
    return this.contract.schema.ast.nodes.find(
      (node: Node) => node.nodeType === 'ContractDefinition' && node.name === this.contract.schema.contractName,
    );
  }

  public getImports(): Set<string> {
    return this.imports;
  }

  public getMethods(attributes?: string[]): any[] {
    const baseContracts = this.getLinearizedBaseContracts();
    return flatten(baseContracts.map(contract => contract.nodes))
      .filter(({ nodeType, name }) => nodeType === 'FunctionDefinition' && this._isValidMethodName(name))
      .map(node => {
        // filter attributes
        const selectedAttributes = attributes ? pick(node, attributes) : node;
        // get method parameters
        const { parameters } = node.parameters;
        const inputs = parameters.map(({ name, typeDescriptions }) => ({
          name,
          type: typeDescriptions.typeString,
        }));
        // generate the method selector
        const selectorArgs = inputs ? inputs.map(({ type }) => type).join(',') : '';
        const selector = `${node.name}(${selectorArgs})`;

        return { selector, inputs, ...selectedAttributes };
      });
  }

  // This method is used instead of getLinearizedBaseContracts only because
  // it keeps track of the names as well as the IDs of the ancestor contracts,
  // and can yield a better error message to the user than "AST node NN not found"
  public getBaseContractsRecursively(): Node[] {
    const mapBaseContracts = baseContracts =>
      baseContracts.map(c => ({
        id: c.baseName.referencedDeclaration,
        name: c.baseName.name,
      }));
    const baseContractsToVisit = mapBaseContracts(this.getContractNode().baseContracts);
    const visitedBaseContracts = {};

    while (baseContractsToVisit.length > 0) {
      const { id, name } = baseContractsToVisit.pop();
      if (visitedBaseContracts[id]) continue;

      try {
        const node = this.getNode(id, 'ContractDefinition');
        visitedBaseContracts[id] = node;
        baseContractsToVisit.push(...mapBaseContracts(node.baseContracts));
      } catch (err) {
        if (err instanceof NodeNotFoundError) {
          throw new Error(
            `Cannot find source data for contract ${name} (base contract of ${this.contract.schema.contractName}). This often happens because either:\n- An incremental compilation step went wrong. Clear your build folder and recompile.\n- There is more than one contract named ${name} in your project (including dependencies). Make sure all contracts have a unique name, and that you are not importing dependencies with duplicated contract names (for example, @openzeppelin/contracts-ethereum-package and @openzeppelin/contracts).`,
          );
        } else {
          throw err;
        }
      }
    }

    return Object.values(visitedBaseContracts);
  }

  public getLinearizedBaseContracts(mostDerivedFirst = false): Node[] {
    const contracts = this.getContractNode().linearizedBaseContracts.map(id => this.getNode(id, 'ContractDefinition'));
    return mostDerivedFirst ? contracts : reverse(contracts);
  }

  public getNode(id: string, type: string): Node | never {
    if (!this.nodes[id]) throw new NodeNotFoundError(id, type);

    const candidates = this.nodes[id].filter((node: Node) => node.nodeType === type);
    switch (candidates.length) {
      case 0:
        throw new NodeNotFoundError(id, type);
      case 1:
        return candidates[0];
      default:
        throw new MultipleNodesFoundError(id, type);
    }
  }

  private _collectImports(ast: any): void {
    ast.nodes
      .filter(node => node.nodeType === 'ImportDirective')
      .map(node => node.absolutePath)
      .forEach((importPath: string) => {
        if (this.imports.has(importPath)) return;
        this.imports.add(importPath);
        this.artifacts.getArtifactsFromSourcePath(importPath).forEach(importedArtifact => {
          this._collectNodes(importedArtifact.ast);
          this._collectImports(importedArtifact.ast);
        });
      });
  }

  private _collectNodes(node: Node): void {
    // Return if we have already seen this node
    if (some(this.nodes[node.id] || [], n => isEqual(n, node))) return;

    // Only process nodes of the filtered types (or SourceUnits)
    if (node.nodeType !== 'SourceUnit' && this.nodesFilter && !includes(this.nodesFilter, node.nodeType)) return;

    // Add node to collection with this id otherwise
    if (!this.nodes[node.id]) this.nodes[node.id] = [];
    this.nodes[node.id].push(node);

    // Call recursively to children
    if (node.nodes) node.nodes.forEach(this._collectNodes.bind(this));
  }

  private _isValidMethodName(name) {
    return name !== '' && name !== 'isConstructor';
  }
}
