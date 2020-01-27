export type NodeType =
  | 'SourceUnit'
  | 'ImportDirective'
  | 'VariableDeclaration'
  | 'ContractDefinition'
  | 'ModifierInvocation'
  | 'FunctionDefinition'
  | 'EventDefinition'
  | 'ModifierDefinition'
  | 'InheritanceSpecifier'
  | 'Identifier'
  | 'Literal'
  | 'Block'
  | 'ElementaryTypeName'
  | 'UserDefinedTypeName'
  | 'ParameterList'
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
  baseContracts: InheritanceSpecifier[];
  fullyImplemented: boolean;
}

export interface InheritanceSpecifier extends Node {
  nodeType: 'InheritanceSpecifier';
  baseName: UserDefinedTypeName;
  arguments: Literal[];
}

export interface VariableDeclaration extends Node {
  nodeType: 'VariableDeclaration';
  visibility: 'internal' | 'public' | 'private';
  name: string;
  constant: boolean;
  typeName: ElementaryTypeName;
  value?: Literal;
}

export interface FunctionDefinition extends Node {
  nodeType: 'FunctionDefinition';
  kind: 'function' | 'constructor' | 'fallback';
  visibility: 'internal' | 'external' | 'public' | 'private';
  name: string;
  documentation: string | null;
  parameters: ParameterList;
  returnParameters: ParameterList;
  modifiers: ModifierInvocation[];
  body: Block;
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

export interface ModifierInvocation extends Node {
  nodeType: 'ModifierInvocation';
  name: string;
  arguments: Literal[];
  modifierName: Identifier;
}

export interface Identifier extends Node {
  nodeType: 'Identifier';
  name: 'Identifier';
}

export interface Literal extends Node {
  nodeType: 'Literal';
}

export interface UserDefinedTypeName extends Node {
  name: string;
  nodeType: 'UserDefinedTypeName';
  typeDescriptions: {
    typeString: string;
  };
}

export interface ElementaryTypeName extends Node {
  nodeType: 'ElementaryTypeName';
  typeDescriptions: {
    typeString: string;
  };
}

export interface ImportDirective extends Node {
  nodeType: 'ImportDirective';
  sourceUnit: number;
  file: string;
  absolutePath: string;
}

export interface PragmaDirective extends Node {
  nodeType: 'PragmaDirective';
}

export interface Block extends Node {
  nodeType: 'Block';
}

export interface ParameterList extends Node {
  nodeType: 'ParameterList';
  parameters: VariableDeclaration[];
}

export type AnyNode = Node | VariableDeclaration | FunctionDefinition | EventDefinition | ModifierDefinition;
