import { eq as semverEq, parse as parseSemver } from 'semver';
import { CompilerVersionOptions } from '../models/compiler/solidity/SolidityContractsCompiler';

export function getPragma(source: string): string {
  if (!source) return null;
  const match = source.match(/pragma solidity\s+([^;]+?)\s*;/m);
  if (!match) return null;
  return match[1];
}

export function compilerVersionsMatch(v1: string, v2: string): boolean {
  if (!v1 || !v2) return false;

  const parseVersion = (version: string) => {
    const cleaned = version
      .replace(/^soljson-v?/, '')
      .replace(/\.js$/, '')
      .replace('g++', 'gcc'); // semver fails when parsing '+' characters as part of the build
    const semver = parseSemver(cleaned);
    if (!semver) throw new Error(`Invalid compiler version ${version}`);
    return semver;
  };

  return semverEq(parseVersion(v1), parseVersion(v2));
}

export function compilerSettingsMatch(
  s1: CompilerVersionOptions,
  s2: CompilerVersionOptions,
) {
  if (!s1 || !s2) return false;

  return (
    s1.evmVersion === s2.evmVersion &&
    ((!s1.optimizer && !s2.optimizer) ||
      (s1.optimizer.enabled == s2.optimizer.enabled &&
        s1.optimizer.runs == s2.optimizer.runs))
  );
}

export function getImports(source: string): string[] {
  // Copied from https://github.com/nomiclabs/buidler/blob/1cd52f91d7f8b6756c5ac33b78f93b151b072ea4/packages/buidler-core/src/internal/solidity/imports.ts
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parser = require('solidity-parser-antlr');
  const ast = parser.parse(source, { tolerant: true });

  const importedFiles: string[] = [];
  parser.visit(ast, {
    ImportDirective: (node: { path: string }) => importedFiles.push(node.path),
  });

  return importedFiles;
}
