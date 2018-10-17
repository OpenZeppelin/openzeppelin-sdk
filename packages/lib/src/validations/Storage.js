import _ from 'lodash';
import path from 'path';
import process from 'process';
import { getBuildArtifacts } from "../utils/BuildArtifacts";

export function getStorageLayout(contract, artifacts) {
  if (!artifacts) artifacts = getBuildArtifacts();
  const layout = new StorageLayout(contract, artifacts)
  const { types, storage } = layout.run()
  return { types, storage }
}

export function getStructsOrEnums({ storage, types }) {
  return storage.filter(variable => containsStructOrEnum(variable.type, types))
}

function containsStructOrEnum(typeName, types) {
  const type = types[typeName]
  if (type.kind === 'struct' || type.kind === 'enum') {
    return true;
  } else if (type.valueType) {
    return containsStructOrEnum(type.valueType, types)
  } else {
    return false;
  }
}

const CONTRACT_TYPE_INFO =  { 
  id: 't_address', 
  kind: 'elementary',
  label: 'address' 
};

const FUNCTION_TYPE_INFO = {
  id: 't_function', 
  kind: 'elementary',
  label: 'function' 
};

class StorageLayout {
  constructor (contract, artifacts) {
    this.artifacts = artifacts
    this.contract = contract
    this.imports = new Set() // Transitive closure of source files imported from the contract
    this.nodes = {} // Map from ast id to nodeset across all visited contracts (note that more than one node may have the same id, due to how truffle compiles artifacts)
    this.types = {} // Types info being collected for the current contract
    this.storage = [] // Storage layout for the current contract
    
  }

  run() {
    this.collectImports(this.contract.ast)
    this.collectNodes(this.contract.ast)
    
    this.getLinearizedBaseContracts().forEach(contractNode => {
      this.visitVariables(contractNode)
    })
    
    return this
  }

  collectImports(ast) {
    ast.nodes
      .filter(node => node.nodeType === 'ImportDirective')
      .map(node => node.absolutePath)
      .forEach(importPath => {
        if (this.imports.has(importPath)) return;
        this.imports.add(importPath);
        this.artifacts.getArtifactsFromSourcePath(importPath).forEach(importedArtifact => {
          this.collectNodes(importedArtifact.ast)
          this.collectImports(importedArtifact.ast)
        })
      })
  }

  collectNodes(node) {
    // Return if we have already seen this node
    if (_.some(this.nodes[node.id] || [], n => _.isEqual(n, node))) return; 
    // Add node to collection with this id otherwise
    if (!this.nodes[node.id]) this.nodes[node.id] = [];
    this.nodes[node.id].push(node);
    // Call recursively to children
    if (node.nodes) node.nodes.forEach(this.collectNodes.bind(this));
  }

  visitVariables(contractNode) {
    const sourcePath = path.relative(process.cwd(), this.getNode(contractNode.scope, 'SourceUnit').absolutePath)
    const varNodes = contractNode.nodes.filter(node => node.stateVariable && !node.constant)
    varNodes.forEach(node => {
      const typeInfo = this.getAndRegisterTypeInfo(node.typeName)
      this.registerType(typeInfo)
      const storageInfo = { contract: contractNode.name, path: sourcePath, ... this.getStorageInfo(node, typeInfo) }
      this.storage.push(storageInfo)
    })
  }

  registerType(typeInfo) {
    this.types[typeInfo.id] = typeInfo
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

  getContractNode() {
    return this.contract.ast.nodes.find(node => 
      node.nodeType === 'ContractDefinition' && 
      node.name === this.contract.contractName
    )
  }

  getLinearizedBaseContracts() {
    return _.reverse(this.getContractNode().linearizedBaseContracts.map(id => this.getNode(id, 'ContractDefinition')))
  }

  getStorageInfo(varNode, typeInfo) {
    return {
      label: varNode.name,
      astId: varNode.id,
      type: typeInfo.id,
      src: varNode.src
    }
  }

  getAndRegisterTypeInfo(node) {
    const typeInfo = this.getTypeInfo(node);
    this.registerType(typeInfo);
    return typeInfo;
  }

  getTypeInfo(node) {
    switch (node.nodeType) {
      case 'ElementaryTypeName': return this.getElementaryTypeInfo(node);
      case 'ArrayTypeName': return this.getArrayTypeInfo(node);
      case 'Mapping': return this.getMappingTypeInfo(node);
      case 'UserDefinedTypeName': return this.getUserDefinedTypeInfo(node);
      case 'FunctionTypeName': return this.getFunctionTypeInfo(node);
      default: throw Error(`Cannot get type info for unknown node type ${node.nodeType}`);
    }
  }

  getUserDefinedTypeInfo({ referencedDeclaration, typeDescriptions }) {
    const typeIdentifier = this.getTypeIdentifier(typeDescriptions);
    switch (typeIdentifier) {
      case 't_contract': return this.getContractTypeInfo(referencedDeclaration)
      case 't_struct': return this.getStructTypeInfo(referencedDeclaration)
      case 't_enum': return this.getEnumTypeInfo(referencedDeclaration)
      default: throw Error(`Unknown type identifier ${typeIdentifier} for ${typeDescriptions.typeString}`)
    }
  }

  getTypeIdentifier({ typeIdentifier }) {
    return typeIdentifier.split('$', 1)[0]
  }

  getElementaryTypeInfo({ typeDescriptions }) {
    const identifier = typeDescriptions.typeIdentifier
      .replace(/_storage(_ptr)?$/, '')
    
    return { 
      id: identifier,
      kind: 'elementary',
      label: typeDescriptions.typeString
    }
  }
  
  getArrayTypeInfo({ baseType, length, }) {
    const { id: baseTypeId, label: baseTypeLabel } = this.getAndRegisterTypeInfo(baseType)
    const lengthDescriptor = length ? length.value : 'dyn'
    const lengthLabel = length ? length.value : ''
    return { 
      id: `t_array:${lengthDescriptor}<${baseTypeId}>`,
      valueType: baseTypeId,
      length: lengthDescriptor,
      kind: 'array',
      label: `${baseTypeLabel}[${lengthLabel}]`
    }
  }

  getMappingTypeInfo({ valueType }) {
    // We ignore the keyTypeId, since it's always hashed and takes up the same amount of space; we only care about the last value type
    const { id: valueTypeId, label: valueTypeLabel } = this.getValueTypeInfo(valueType)
    return {
      id: `t_mapping<${valueTypeId}>`, 
      valueType: valueTypeId,
      label: `mapping(key => ${valueTypeLabel})`,
      kind: 'mapping'
    }
  }

  getContractTypeInfo() {
    // Process a reference to a contract as an address, since we only care about storage size
    return { ... CONTRACT_TYPE_INFO }
  }

  getFunctionTypeInfo() {
    // Process a reference to a function disregarding types, since we only care how much space it takes
    return { ... FUNCTION_TYPE_INFO }
  }

  getStructTypeInfo(referencedDeclaration) {
    // Identify structs by contract and name
    const referencedNode = this.getNode(referencedDeclaration, 'StructDefinition');
    const id = `t_struct<${referencedNode.canonicalName}>`
    if (this.types[id]) return this.types[id]

    // We shortcircuit type registration in this scenario to handle recursive structs
    const typeInfo = { id, kind: 'struct', label: referencedNode.canonicalName }
    this.registerType(typeInfo)

    // Store members info in type info
    const members = referencedNode.members
      .filter(member => member.nodeType === 'VariableDeclaration')
      .map(member => {
        const typeInfo = this.getAndRegisterTypeInfo(member.typeName)
        return this.getStorageInfo(member, typeInfo)
      })

    Object.assign(typeInfo, { members })
    return typeInfo
  }

  getEnumTypeInfo(referencedDeclaration) {
    // Store canonical name and members for an enum
    const referencedNode = this.getNode(referencedDeclaration, 'EnumDefinition');
    return {
      id: `t_enum<${referencedNode.canonicalName}>`,
      kind: 'enum',
      label: referencedNode.canonicalName,
      members: referencedNode.members.map(m => m.name)
    }
  }

  getValueTypeInfo(node) {
    return (node.nodeType === 'Mapping')
      ? this.getValueTypeInfo(node.valueType)
      : this.getAndRegisterTypeInfo(node)
  }  
}
