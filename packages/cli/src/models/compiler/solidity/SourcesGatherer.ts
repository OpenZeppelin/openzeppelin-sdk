import { Loggy } from '@openzeppelin/upgrades';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { getImports } from '../../../utils/solidity';
import isUrl from 'is-url';
import findUp from 'find-up';

interface ImportStatement {
  path: string;
  importedFrom: ResolvedFile;
}

interface ResolvedFile {
  name: string;
  url: string;
  root: string;
  dependency?: string;
}

interface ResolvedFileWithContent extends ResolvedFile {
  content: string;
}

/**
 * Starts with roots and traverses the whole depedency tree of imports, returning an array of sources
 * @param rootContracts
 * @param workingDir What's the starting working dir for resolving relative imports in roots
 * @param resolver
 */
export async function gatherSources(rootContracts: string[], workingDir: string): Promise<ResolvedFileWithContent[]> {
  const result: ResolvedFileWithContent[] = [];
  const queue: ResolvedFile[] = [];
  const alreadyProcessedUrls = new Set<string>();

  for (const contract of rootContracts) {
    queue.push({
      name: relative(workingDir, contract),
      url: resolve(workingDir, contract),
      root: workingDir,
    });
  }

  while (queue.length > 0) {
    const fileToProcess = queue.shift();

    if (alreadyProcessedUrls.has(fileToProcess.url)) continue;
    alreadyProcessedUrls.add(fileToProcess.url);

    const content = await promisify(fs.readFile)(fileToProcess.url, 'utf-8');
    const fileWithContent = { ...fileToProcess, content: content.toString() };
    result.push(fileWithContent);

    const foundImports = tryGetImports(fileWithContent);
    for (const foundImport of foundImports) {
      const importStatement = { path: foundImport, importedFrom: fileToProcess };
      const resolvedImport = await tryResolveImportFile(importStatement);
      if (resolvedImport !== undefined) queue.push(resolvedImport);
    }
  }

  return result;
}

function tryGetImports(resolvedFile: ResolvedFileWithContent): string[] {
  try {
    return getImports(resolvedFile.content);
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
      `Error while parsing ${trimFile(resolvedFile.name)}`,
    );
    return [];
  }
}

async function tryResolveImportFile(importStatement: ImportStatement): Promise<ResolvedFile | undefined> {
  try {
    return await resolveImportFile(importStatement);
  } catch (err) {
    // Our custom fuzzy parser may yield false positives, potentially asking for imports that don't exist. This can
    // happen both due to parser bugs and to invalid Solidity sources the parser accepts. Because of this, we carry on
    // to the compiler instead of erroring out: if an import is indeed missing or the code is incorrect, the compiler
    // will complain about this with a more accurate error message.
    Loggy.noSpin.warn(__filename, 'gatherSources', 'compile-warnings', `${err.message}`);
  }
}

async function resolveImportFile({ path, importedFrom }: ImportStatement): Promise<ResolvedFile> {
  // We support the following import paths:
  // 1- An absolute path: /foo/bar/baz.sol
  // 2- A path relative to the current file: ../foo/bar.sol
  // 3- A path relative to the current project root: contracts/foo/bar.sol
  // 4- A path to a dependency: @openzeppelin/contracts/foo/bar.sol

  if (isUrl(path)) {
    throw new Error(`Error resolving '${trimFile(path)}': URL imports are not supported`);
  }

  // 1- Absolute paths
  if (isAbsolute(path)) {
    if (await fileExists(path)) {
      return { ...importedFrom, name: path, url: path };
    } else {
      throw new Error(`Could not find file '${trimFile(path)}'`);
    }
  }

  // 2- Relative paths
  if (path.startsWith('.')) {
    const url = resolve(dirname(importedFrom.url), path);
    if (await fileExists(url)) {
      // If relativeTo is absolute, then url and name are the same
      // so the global name is absolute as well
      const name = isAbsolute(importedFrom.name) ? url : join(dirname(importedFrom.name), path);
      return { ...importedFrom, name, url };
    } else {
      throw new Error(
        `Could not find file ${trimFile(path)} relative to ${importedFrom.name} in project ${importedFrom.root}`,
      );
    }
  }

  // 3- Path relative to project root
  const localUrl = join(importedFrom.root, path);
  if (await fileExists(localUrl)) {
    const name = join(importedFrom.dependency ?? '', path);
    return { ...importedFrom, name, url: localUrl };
  }

  // 4- Path to dependency (only if previous one did not match)
  const dependencyUrl = resolveDependency(path, importedFrom);
  const dependencyRoot = await findUp('package.json', { cwd: dependencyUrl });
  if (dependencyRoot === undefined) throw new Error(`Could not find package root for contract ${dependencyUrl}`);
  const dependencyName = require(dependencyRoot).name;

  return {
    name: path,
    dependency: dependencyName,
    url: dependencyUrl,
    root: dirname(dependencyRoot),
  };
}

function resolveDependency(path: string, importedFrom: ResolvedFile): string {
  try {
    return require.resolve(path, { paths: [importedFrom.root] });
  } catch (err) {
    throw new Error(`Could not find ${trimFile(path)} imported from ${importedFrom.url}`);
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    return (await promisify(fs.stat)(file)).isFile();
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

function trimFile(file: string): string {
  return file.length < 100 ? file : file.substring(0, 100) + '...';
}
