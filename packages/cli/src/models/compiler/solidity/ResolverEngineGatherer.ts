import { ResolverEngine } from '@resolver-engine/core';
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

interface ImportTreeNode extends ImportFile {
  uri: string;
  // uri and url the same as in rest of resolver-engine
  // it might mean github:user/repo/path.sol and raw link
  // or it might mean relative vs absolute file path
  imports: { uri: string; url: string }[];
}

/**
 * This function accepts root files to be searched for and resolves the sources, finds the imports in each source and traverses the whole dependency tree gathering absolute and uri paths
 * @param roots
 * @param workingDir
 * @param resolver
 */
async function gatherDependencyTree(
  roots: string[],
  workingDir: string,
  resolver: ResolverEngine<ImportFile>,
): Promise<ImportTreeNode[]> {
  const result: ImportTreeNode[] = [];
  const alreadyImported = new Set();

  /**
   * This function traverses the depedency tree and calculates absolute paths for each import on the way storing each file in in a global array
   * @param file File in a depedency that should now be traversed
   * @returns An absolute path for the requested file
   */
  async function dfs(file: {
    searchCwd: string;
    uri: string;
  }): Promise<string> {
    const url = await resolver.resolve(file.uri, file.searchCwd);
    if (alreadyImported.has(url)) {
      return url;
    }

    const resolvedFile = await resolver.require(file.uri, file.searchCwd);

    alreadyImported.add(url);

    const foundImportURIs = getImports(resolvedFile.source);

    const fileNode: ImportTreeNode = {
      uri: file.uri,
      imports: [],
      ...resolvedFile,
    };

    const resolvedCwd = pathSys.dirname(url);
    for (const importUri of foundImportURIs) {
      const importUrl = await dfs({ searchCwd: resolvedCwd, uri: importUri });
      fileNode.imports.push({ uri: importUri, url: importUrl });
    }

    result.push(fileNode);
    return resolvedFile.url;
  }

  await Promise.all(
    roots.map(what => dfs({ searchCwd: workingDir, uri: what })),
  );

  return result;
}

function stripNodes(nodes: ImportTreeNode[]): ImportFile[] {
  return nodes.map(node => {
    return { url: node.url, source: node.source, provider: node.provider };
  });
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
    workingDir += '/';
  }

  const absoluteRoots = roots.map(what => resolvePath(workingDir, what));
  for (const absWhat of absoluteRoots) {
    queue.push({ cwd: workingDir, file: absWhat, relativeTo: workingDir });
    alreadyImported.add(absWhat);
  }
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileData = queue.shift()!;
    const resolvedFile: ImportFile = await resolveImportFile(
      resolver,
      fileData,
    );
    const foundImports = getImports(resolvedFile.source);

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

    const fileParentDir = pathSys.dirname(resolvedFile.url);
    for (const foundImport of foundImports) {
      let importName: string;
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
      const cwd = pathSys.relative(process.cwd(), fileData.cwd);
      const relativeTo = pathSys.relative(process.cwd(), fileData.relativeTo);
      err.message = `Could not find file ${
        fileData.file
      } in folder ${cwd} (imported from ${relativeTo})`;
    }
    throw err;
  }
}

/**
 * This function gathers sources and **REWRITES IMPORTS** inside the source files into resolved, absolute paths instead of using shortcut forms
 * Because the remapping api in solc is not compatible with multiple existing projects and frameworks, changing relative paths to absolute paths
 * makes us avoid any need for finding imports after starting the solc compilation
 * @param roots
 * @param workingDir What's the starting working dir for resolving relative imports in roots
 * @param resolver
 */
export async function gatherSourcesAndCanonizeImports(
  roots: string[],
  workingDir: string,
  resolver: ResolverEngine<ImportFile>,
): Promise<ImportFile[]> {
  function canonizeFile(file: ImportTreeNode) {
    file.imports.forEach(
      i => (file.source = file.source.replace(i.uri, i.url)),
    );
  }

  const sources = await gatherDependencyTree(roots, workingDir, resolver);
  sources.forEach(canonizeFile);
  return stripNodes(sources);
}
