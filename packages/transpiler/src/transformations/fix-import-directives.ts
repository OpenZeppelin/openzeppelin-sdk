import { getImportDirectives, getSourceIndices } from '../solc/ast-utils';
import { Artifact } from '../solc/artifact';
import { Transformation } from '../transformation';

export function fixImportDirectives(
  artifact: Artifact,
  artifacts: Artifact[],
  contracts: Artifact[],
): Transformation[] {
  const imports = getImportDirectives(artifact.ast);
  return imports
    .map(imp => {
      const [start, len] = getSourceIndices(imp);
      const isTranspiled = artifacts.some(art => art.ast.id === imp.sourceUnit && contracts.includes(art));
      const isLocal = imp.file.startsWith('.');
      const prefix = !isLocal ? './' : '';
      const fixedPath = `import "${prefix}${imp.file.replace('.sol', 'Upgradable.sol')}";`;
      return !isLocal && !isTranspiled
        ? null
        : {
            start,
            end: start + len,
            text: !isTranspiled ? `import "${imp.absolutePath}";` : fixedPath,
          };
    })
    .filter((tran): tran is Transformation => tran !== null);
}
