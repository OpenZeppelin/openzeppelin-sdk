import { ResolverEngine } from '@openzeppelin/resolver-engine-core';
import { Loggy } from '@openzeppelin/upgrades';
import pathSys from 'path';
import urlSys from 'url';
import { getImports } from '../../../utils/solidity';
import isUrl from 'is-url';

// Adapted from resolver-engine
// https://github.com/Crypto-Punkers/resolver-engine/blob/master/packages/imports/src/parsers/importparser.ts

interface ImportFile {
  url: string;
  source: string;
  provider: string;
}

/**
 * Starts with roots and traverses the whole depedency tree of imports, returning an array of sources
 * @param roots
 * @param workingDir What's the starting working dir for resolving relative imports in roots
 * @param resolver
 */
export async function gatherSources(
  roots: string[],
  workingDir: string,
  resolver: ResolverEngine<ImportFile>,
): Promise<ImportFile[]> {
  const result: ImportFile[] = [];
  const queue: { cwd: string; file: string; relativeTo: string }[] = [];
  const alreadyImported = new Set();

  if (workingDir !== '') {
    workingDir += pathSys.sep;
  }

  const absoluteRoots = roots.map(what => resolvePath(workingDir, what));
  for (const absWhat of absoluteRoots) {
    queue.push({ cwd: workingDir, file: absWhat, relativeTo: workingDir });
    alreadyImported.add(absWhat);
  }
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileData = queue.shift()!;

    let resolvedFile: ImportFile;
    try {
      resolvedFile = await resolveImportFile(resolver, fileData);
    } catch (err) {
      // Our custom fuzzy parser may yield false positives, potentially asking for imports that don't exist. This can
      // happen both due to parser bugs and to invalid Solidity sources the parser accepts. Because of this, we carry on
      // to the compiler instead of erroring out: if an import is indeed missing or the code is incorrect, the compiler
      // will complain about this with a more accurate error message.
      Loggy.noSpin.warn(__filename, 'gatherSources', 'compile-warnings', `${err.message}`);
      continue;
    }

    // if imported path starts with '.' we assume it's relative and return it's
    // path relative to resolved name of the file that imported it
    // if not - return the same name it was imported with
    let relativePath: string;
    if (fileData.file[0] === '.') {
      relativePath = resolvePath(fileData.relativeTo, fileData.file);
      result.push({
        url: relativePath,
        source: resolvedFile.source,
        provider: resolvedFile.provider,
      });
    } else {
      relativePath = fileData.file;
      result.push({
        url: relativePath,
        source: resolvedFile.source,
        provider: resolvedFile.provider,
      });
    }

    let foundImports: string[];
    try {
      foundImports = getImports(resolvedFile.source);
    } catch {
      // The are two reasons why the parser may crash:
      //  - the source is not valid Solidity code
      //  - the parser has a bug
      // Invalid source will be better diagnosed by the compiler, meaning we shouldn't halt execution so that it gets a
      // chance to inspect the source. A buggy parser will produce false negatives, but since we're not able to detect
      // that here, it makes more sense to fail loudly, hopefully leading to a bug report by a user.
      Loggy.noSpin.warn(
        __filename,
        'gatherSources',
        'solidity-parser-warnings',
        `Error while parsing ${trimURL(resolvedFile.url)}`,
      );
      foundImports = [];
    }

    const fileParentDir = pathSys.dirname(resolvedFile.url);

    for (const foundImport of foundImports) {
      let importName: string;
      // If it's relative, resolve it; otherwise, pass through
      if (foundImport[0] === '.') {
        importName = resolvePath(relativePath, foundImport);
      } else {
        importName = foundImport;
      }
      if (!alreadyImported.has(importName)) {
        alreadyImported.add(importName);
        queue.push({
          cwd: fileParentDir,
          file: foundImport,
          relativeTo: relativePath,
        });
      }
    }
  }

  return result;
}

function resolvePath(workingDir: string, relativePath: string): string {
  // If the working dir is an URL (a file imported from an URL location)
  // or the relative path is an URL (an URL imported from a local file)
  // use url.resolve, which will work in both cases.
  // > url.resolve('/local/folder/', 'http://example.com/myfile.sol')
  // 'http://example.com/myfile.sol'
  // > url.resolve('http://example.com/', 'myfile.sol')
  // 'http://example.com/myfile.sol'
  //
  // If not, use path.resolve, since using url.resolve will escape certain
  // charaters (e.g. a space as an %20), breaking the path
  // > url.resolve('/local/path/with spaces/', 'myfile.sol')
  // '/local/path/with%20spaces/myfile.sol'

  return isUrl(workingDir) || isUrl(relativePath)
    ? urlSys.resolve(workingDir, relativePath)
    : pathSys.resolve(pathSys.dirname(workingDir), relativePath);
}

async function resolveImportFile(
  resolver: ResolverEngine<ImportFile>,
  fileData: { cwd: string; file: string; relativeTo: string },
): Promise<ImportFile> {
  try {
    return await resolver.require(fileData.file, fileData.cwd);
  } catch (err) {
    if (err.message.startsWith('None of the sub-resolvers resolved')) {
      // If the import failed, we retry it from the project root,
      // in order to support `import "contracts/folder/Contract.sol";`
      // See https://github.com/zeppelinos/zos/issues/1024
      if (fileData.cwd !== process.cwd() && fileData.file[0] !== '.') {
        return resolveImportFile(resolver, {
          ...fileData,
          cwd: process.cwd(),
        });
      }

      const cwd = pathSys.relative(process.cwd(), fileData.cwd);
      const cwdDesc = cwd.length === 0 ? 'the project' : `folder ${cwd}`;
      const relativeTo = pathSys.relative(process.cwd(), fileData.relativeTo);
      err.message = `Could not find file ${trimURL(fileData.file)} in ${cwdDesc} (imported from ${relativeTo})`;
    }

    throw err;
  }
}

function trimURL(url: string): string {
  return url.length < 40 ? url : url.substring(0, 40) + '...';
}
