import { eq as semverEq, parse as parseSemver } from 'semver';
import { CompilerVersionOptions } from '../models/compiler/solidity/SolidityContractsCompiler';
import { getMetadata } from '@openzeppelin/fuzzy-solidity-import-parser';
import { Loggy } from '@openzeppelin/upgrades';

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

export function compilerSettingsMatch(s1: CompilerVersionOptions, s2: CompilerVersionOptions) {
  if (!s1 || !s2) return false;

  return (
    s1.evmVersion === s2.evmVersion &&
    ((!s1.optimizer && !s2.optimizer) ||
      (s1.optimizer.enabled == s2.optimizer.enabled && s1.optimizer.runs == s2.optimizer.runs))
  );
}

export function getImports(source: string, url: string): string[] {
  try {
    return getMetadata(source).imports;
  } catch {
    // The are two reasons why the parser may crash:
    //  - the source is not valid Solidity code
    //  - the parser has a bug
    // Invalid source will be better diagnosed by the compiler, meaning we shouldn't halt execution so that it gets a
    // chance to inspect the source. A buggy parser will produce false negatives, but since we're not able to detect
    // that here, it makes more sense to fail loudly, hopefully leading to a bug report by a user.
    Loggy.noSpin.warn(__filename, 'getImports', 'solidity-parser-warnings', `Error while parsing ${trimURL(url)}`);
    return [];
  }
}

function trimURL(url: string): string {
  return url.length < 40 ? url : url.substring(0, 40) + '...';
}
