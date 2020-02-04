import { some, isEqual, reverse } from 'lodash';
import path from 'path';
import process from 'process';
import { getBuildArtifacts } from '../artifacts/BuildArtifacts';
import Contract from '../artifacts/Contract.js';
import { BuildArtifacts } from '../artifacts/BuildArtifacts.js';
import { Node, NodeMapping, TypeInfo, TypeInfoMapping, StorageInfo } from '../utils/ContractAST';

// TS-TODO: define return type after typing class members below.
export function getStorageLayout(contract: Contract, artifacts: BuildArtifacts): StorageLayoutInfo {
  if (!artifacts) artifacts = getBuildArtifacts();

  const layout = new StorageLayout(contract, artifacts);
  const { types, storage } = layout.run();

  return { types, storage };
}

// TS-TODO: Define parameter after typing class members below.
// TS-TODO: define return type after typing class members below.

export function getStructsOrEnums(info: StorageLayoutInfo): StorageInfo[] {
  return info.storage.filter((variable: any) => containsStructOrEnum(variable.type, info.types));
}

// TS-TODO: Define parameter types type after typing class members below.
function containsStructOrEnum(typeName: string, types): boolean {
  const type = types[typeName];
  if (type.kind === 'struct' || type.kind === 'enum') return true;
  else if (type.valueType) return containsStructOrEnum(type.valueType, types);
  else return false;
}

const CONTRACT_TYPE_INFO: TypeInfo = {
  id: 't_address',
  kind: 'elementary',
  label: 'address',
};

const FUNCTION_TYPE_INFO: TypeInfo = {
  id: 't_function',
  kind: 'elementary',
  label: 'function',
};

export interface StorageLayoutInfo {
  types: TypeInfoMapping;
  storage: StorageInfo[];
}

class StorageLayout {
  private artifacts: BuildArtifacts;
  private contract: Contract;
  private imports: Set<any>;

  private nodes: NodeMapping;

  // TS-TODO: types and storage could be private and exposed via a readonly getter.
  public types: TypeInfoMapping;
  public storage: StorageInfo[];

  public constructor(contract: Contract, artifacts: BuildArtifacts) {
    this.artifacts = artifacts;
    this.contract = contract;

    // Transitive closure of source files imported from the contract.
    this.imports = new Set();

    // Map from ast id to nodeset across all visited contracts.
    // (Note that more than one node may have the same id, due to how truffle compiles artifacts).
    this.nodes = {};

    // Types info being collected for the current contract.
    this.types = {};

    // Storage layout for the current contract.
    this.storage = [];
  }

  public run(): StorageLayout {
    this.collectImports(this.contract.schema.ast);
    this.collectNodes(this.contract.schema.ast);

    // TS-TODO: define contractNode type.
    this.getLinearizedBaseContracts().forEach((contractNode: Node) => {
      this.visitVariables(contractNode);
    });

    return this;
  }

  // TS-TODO: could type ast from artifacts/web3.
  private collectImports(ast: any): void {
    ast.nodes
      .filter(node => node.nodeType === 'ImportDirective')
      .map(node => node.absolutePath)
      .forEach(importPath => {
        if (this.imports.has(importPath)) return;
        this.imports.add(importPath);
        this.artifacts.getArtifactsFromSourcePath(importPath).forEach(importedArtifact => {
          this.collectNodes(importedArtifact.ast);
          this.collectImports(importedArtifact.ast);
        });
      });
  }

  private collectNodes(node: Node): void {
    // Return if we have already seen this node.
    if (some(this.nodes[node.id] || [], n => isEqual(n, node))) return;

    // Add node to collection with this id otherwise.
    if (!this.nodes[node.id]) this.nodes[node.id] = [];
    this.nodes[node.id].push(node);

    // Call recursively to children.
    if (node.nodes) node.nodes.forEach(this.collectNodes.bind(this));
  }

  private visitVariables(contractNode: Node): void {
    const sourcePath = path.relative(process.cwd(), this.getNode(contractNode.scope, 'SourceUnit').absolutePath);

    const varNodes = contractNode.nodes.filter((node: Node) => node.stateVariable && !node.constant);
    varNodes.forEach(node => {
      const typeInfo = this.getAndRegisterTypeInfo(node.typeName);
      this.registerType(typeInfo);
      const storageInfo = {
        contract: contractNode.name,
        path: sourcePath,
        ...this.getStorageInfo(node, typeInfo),
      };
      this.storage.push(storageInfo);
    });
  }

  private registerType(typeInfo: TypeInfo): void {
    this.types[typeInfo.id] = typeInfo;
  }

  private getNode(id: number, nodeType: string): Node | never {
    if (!this.nodes[id]) throw Error(`No AST nodes with id ${id} found`);

    const candidates = this.nodes[id].filter(node => node.nodeType === nodeType);
    switch (candidates.length) {
      case 0:
        throw Error(
          `No AST nodes of type ${nodeType} with id ${id} found (got ${this.nodes[id]
            .map((node: any) => node.nodeType)
            .join(', ')})`,
        );
      case 1:
        return candidates[0];
      default:
        throw Error(
          `Found more than one node of type ${nodeType} with the same id ${id}. Please try clearing your build artifacts and recompiling your contracts.`,
        );
    }
  }

  private getContractNode(): Node {
    return this.contract.schema.ast.nodes.find(
      node => node.nodeType === 'ContractDefinition' && node.name === this.contract.schema.contractName,
    );
  }

  private getLinearizedBaseContracts(): number[] {
    return reverse(
      this.getContractNode().linearizedBaseContracts.map((id: number) => this.getNode(id, 'ContractDefinition')),
    );
  }

  private getStorageInfo(varNode, typeInfo): StorageInfo {
    return {
      label: varNode.name,
      astId: varNode.id,
      type: typeInfo.id,
      src: varNode.src,
    };
  }

  private getAndRegisterTypeInfo(node: Node): TypeInfo {
    const typeInfo = this.getTypeInfo(node);
    this.registerType(typeInfo);
    return typeInfo;
  }

  private getTypeInfo(node): TypeInfo {
    switch (node.nodeType) {
      case 'ElementaryTypeName':
        return this.getElementaryTypeInfo(node);
      case 'ArrayTypeName':
        return this.getArrayTypeInfo(node);
      case 'Mapping':
        return this.getMappingTypeInfo(node);
      case 'UserDefinedTypeName':
        return this.getUserDefinedTypeInfo(node);
      case 'FunctionTypeName':
        return this.getFunctionTypeInfo();
      default:
        throw Error(`Cannot get type info for unknown node type ${node.nodeType}`);
    }
  }

  private getUserDefinedTypeInfo({ referencedDeclaration, typeDescriptions }) {
    const typeIdentifier = this.getTypeIdentifier(typeDescriptions);
    switch (typeIdentifier) {
      case 't_contract':
        return this.getContractTypeInfo();
      case 't_struct':
        return this.getStructTypeInfo(referencedDeclaration);
      case 't_enum':
        return this.getEnumTypeInfo(referencedDeclaration);
      default:
        throw Error(`Unknown type identifier ${typeIdentifier} for ${typeDescriptions.typeString}`);
    }
  }

  private getTypeIdentifier({ typeIdentifier }) {
    return typeIdentifier.split('$', 1)[0];
  }

  private getElementaryTypeInfo({ typeDescriptions }): TypeInfo {
    const identifier = typeDescriptions.typeIdentifier.replace(/_storage(_ptr)?$/, '');

    return {
      id: identifier,
      kind: 'elementary',
      label: typeDescriptions.typeString,
    };
  }

  private getArrayTypeInfo({ baseType, length }): TypeInfo {
    const { id: baseTypeId, label: baseTypeLabel } = this.getAndRegisterTypeInfo(baseType);
    const lengthDescriptor = length ? length.value : 'dyn';
    const lengthLabel = length ? length.value : '';
    return {
      id: `t_array:${lengthDescriptor}<${baseTypeId}>`,
      valueType: baseTypeId,
      length: lengthDescriptor,
      kind: 'array',
      label: `${baseTypeLabel}[${lengthLabel}]`,
    };
  }

  private getMappingTypeInfo({ valueType }): TypeInfo {
    // We ignore the keyTypeId, since it's always hashed and takes up the same amount of space; we only care about the last value type
    const { id: valueTypeId, label: valueTypeLabel } = this.getValueTypeInfo(valueType);
    return {
      id: `t_mapping<${valueTypeId}>`,
      valueType: valueTypeId,
      label: `mapping(key => ${valueTypeLabel})`,
      kind: 'mapping',
    };
  }

  private getContractTypeInfo(): TypeInfo {
    // Process a reference to a contract as an address, since we only care about storage size
    return { ...CONTRACT_TYPE_INFO };
  }

  private getFunctionTypeInfo(): TypeInfo {
    // Process a reference to a function disregarding types, since we only care how much space it takes
    return { ...FUNCTION_TYPE_INFO };
  }

  private getStructTypeInfo(referencedDeclaration): TypeInfo {
    // Identify structs by contract and name
    const referencedNode = this.getNode(referencedDeclaration, 'StructDefinition');
    const id = `t_struct<${referencedNode.canonicalName}>`;
    if (this.types[id]) return this.types[id];

    // We shortcircuit type registration in this scenario to handle recursive structs
    const typeInfo = {
      id,
      kind: 'struct',
      label: referencedNode.canonicalName,
      members: [],
    };
    this.registerType(typeInfo);

    // Store members info in type info
    const members = referencedNode.members
      .filter(member => member.nodeType === 'VariableDeclaration')
      .map(member => {
        const memberTypeInfo = this.getAndRegisterTypeInfo(member.typeName);
        return this.getStorageInfo(member, memberTypeInfo);
      });

    Object.assign(typeInfo, { members });

    return typeInfo;
  }

  private getEnumTypeInfo(referencedDeclaration): TypeInfo {
    // Store canonical name and members for an enum
    const referencedNode = this.getNode(referencedDeclaration, 'EnumDefinition');
    return {
      id: `t_enum<${referencedNode.canonicalName}>`,
      kind: 'enum',
      label: referencedNode.canonicalName,
      members: referencedNode.members.map(m => m.name),
    };
  }

  private getValueTypeInfo(node): TypeInfo {
    return node.nodeType === 'Mapping' ? this.getValueTypeInfo(node.valueType) : this.getAndRegisterTypeInfo(node);
  }
}
