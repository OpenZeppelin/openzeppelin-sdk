import { getImportDirectives, getSourceIndices } from '../solc/ast-utils';
import { Artifact } from '../solc/artifact';
import { Transformation } from '../transformation';

export function fixImportDirectives(artifact: Artifact, artifacts: Artifact[], contracts: string[]): Transformation[] {
  const imports = getImportDirectives(artifact.ast);
  return imports.map(imp => {
    const [start, len] = getSourceIndices(imp);
    const isTranspiled = artifacts.some(
      art => art.ast.id === imp.sourceUnit && contracts.some(contract => contract === art.contractName),
    );
    const prefix = !imp.file.startsWith('.') ? './' : '';
    const fixedPath = `import "${prefix}${imp.file.replace('.sol', 'Upgradable.sol')}";`;
    return {
      start,
      end: start + len,
      text: !isTranspiled ? `import "${imp.absolutePath}";` : fixedPath,
    };
  });
}
