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
      const fixedPath = `import "${prefix}${imp.file.replace('.sol', 'Upgradeable.sol')}";`;
      const absoluteOriginalImport = `import "${imp.absolutePath}";`;
      const finalImportDirective = !isTranspiled ? absoluteOriginalImport : fixedPath;
      const finalTransformation = isTranspiled
        ? `${absoluteOriginalImport}\n${finalImportDirective}`
        : absoluteOriginalImport;
      return !isLocal && !isTranspiled
        ? null
        : {
            start: start,
            end: start + len,
            text: finalTransformation,
          };
    })
    .filter((transformation): transformation is Transformation => transformation !== null);
}
