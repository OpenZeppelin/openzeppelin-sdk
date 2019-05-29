export function getPragma(source: string): string {
  if (!source) return null;
  const match = source.match(/pragma solidity\s+([^;]+?)\s*;/m);
  if (!match) return null;
  return match[1];
}

export function compilerVersionMatches(v1: string, v2: string): boolean {
  // Drop soljson prefix and compiler implementation suffix to get version, and compare them
  const cleanVersion = (version: string) => version.replace(/^soljson-/, '').replace(/\.Emscripten\.clang$/, '');
  return cleanVersion(v1) === cleanVersion(v2);
}

export function getImports(source: string): string[] {
  // Copied from https://github.com/nomiclabs/buidler/blob/1cd52f91d7f8b6756c5ac33b78f93b151b072ea4/packages/buidler-core/src/internal/solidity/imports.ts
  const parser = require('solidity-parser-antlr');
  const ast = parser.parse(source, { tolerant: true });

  const importedFiles: string[] = [];
  parser.visit(ast, {
    ImportDirective: (node: { path: string }) => importedFiles.push(node.path)
  });

  return importedFiles;
}
