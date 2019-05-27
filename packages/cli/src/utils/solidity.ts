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
