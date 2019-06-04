import fs from 'fs';
import { mkdirpSync, readJsonSync, writeJsonSync } from 'fs-extra';
import axios from 'axios';
import solc from 'solc-wrapper';
import semver from 'semver';
import reverse from 'lodash.reverse';
import uniq from 'lodash.uniq';
import compact from 'lodash.compact';
import castArray from 'lodash.castarray';
import { Logger } from 'zos-lib';
import { homedir } from 'os';
import path from 'path';
import child from '../../../utils/child';
import { tryFunc, tryAwait } from '../../../utils/try';
import { compilerVersionMatches } from '../../../utils/solidity';

const log = new Logger('CompilerProvider');

// Downloaded compilers will be stored here.
// TODO: Check writeability and fall back to tmp if needed
let SOLC_CACHE_PATH = path.join(homedir(), '.solc');

// Modified ENV to use when running native solc
let SOLC_BIN_ENV = null;

// How frequently to renew the solc list
const SOLC_LIST_EXPIRES_IN_SECONDS = 1 * 60 * 60; // 1 hour

// and where to download it from
const SOLC_LIST_URL = 'https://solc-bin.ethereum.org/bin/list.json';

export interface SolcCompiler {
  version(): string;
  compile(input: string): Promise<solc.CompilerOutput>;
}

interface SolcList {
  builds: SolcBuild[];
  latestRelease: string;
  releases: Map<string, string>;
}

export interface SolcBuild {
  path: string;
  version: string;
  build: string;
  longVersion: string;
  keccak256: string;
  urls: string[];
}

class SolcjsCompiler implements SolcCompiler {
  public compiler: solc.Compiler;

  constructor(compilerBinary: any) {
    this.compiler = solc(compilerBinary);
  }

  public version(): string {
    return this.compiler.version();
  }

  public async compile(input: any): Promise<solc.CompilerOutput> {
    return JSON.parse(this.compiler.compile(JSON.stringify(input), undefined));
  }
}

class SolcBinCompiler implements SolcCompiler {
  public _version: string;

  constructor(version: string) {
    this._version = version;
  }

  public version(): string {
    return this._version;
  }

  public async compile(input: any): Promise<solc.CompilerOutput> {
    const output = child.execSync('solc --standard-json', { input: JSON.stringify(input), env: SOLC_BIN_ENV });
    return JSON.parse(output.toString());
  }
}

export async function resolveCompilerVersion(requiredSemver: string | string[]): Promise<SolcBuild> {
  // Create an array with all unique semver restrictions (dropping initial 'v' if set manually by the user)
  const requiredSemvers = uniq(compact(castArray(requiredSemver)))
    .map(str => str.startsWith('v') ? str.slice(1) : str);

  // TODO: Pin the compiler release, so a new release does not cause all contracts to be recompiled and thus redeployed
  const solcList = await getAvailableCompilerVersions();
  const build = await getCompilerVersion(requiredSemvers, solcList);
  return build;
}

export async function fetchCompiler(build: SolcBuild): Promise<SolcCompiler> {
  // Try local compiler and see if version matches
  const localVersion = await localCompilerVersion();
  if (localVersion && compilerVersionMatches(localVersion, build.longVersion)) {
    log.info(`Using local solc compiler found`);
    return new SolcBinCompiler(localVersion);
  }

  // Go with emscriptem version if not
  const localFile = path.join(SOLC_CACHE_PATH, build.path);
  if (!fs.existsSync(localFile)) await downloadCompiler(build, localFile);
  const compilerBinary = getCompilerBinary(localFile);

  // Wrap emscriptem with solc-wrapper
  return new SolcjsCompiler(compilerBinary);
}

export async function getCompiler(requiredSemver: string | string[]): Promise<SolcCompiler> {
  const version = await resolveCompilerVersion(requiredSemver);
  return fetchCompiler(version);
}

async function localCompilerVersion(): Promise<string | void> {
  const output = await tryAwait(() => child.exec('solc --version', { env: SOLC_BIN_ENV }));
  if (!output) return null;
  const match = output.stdout.match(/^Version: ([^\s]+)/m);
  if (!match) return null;
  return match[1];
}

async function getAvailableCompilerVersions(): Promise<SolcList> {
  const localPath = path.join(SOLC_CACHE_PATH, 'list.json');
  mkdirpSync(SOLC_CACHE_PATH);
  if (fs.existsSync(localPath)
    && (Date.now() - (+fs.statSync(localPath).mtime)) < SOLC_LIST_EXPIRES_IN_SECONDS * 1000) {
    return readJsonSync(localPath);
  }

  const response = await axios.get(SOLC_LIST_URL);
  const list = response.data as SolcList;
  writeJsonSync(localPath, list);
  return list;
}

async function getCompilerVersion(requiredSemvers: string[], solcList: SolcList): Promise<SolcBuild> {
  // Returns build from list given a version
  const getBuild = (version: string) => (
    solcList.builds.find(build => build.path === solcList.releases[version])
  );

  // Return latest release if there are no restrictions
  if (requiredSemvers.length === 0) return getBuild(solcList.latestRelease);

  // Look for the most recent release that matches semver restriction
  const comparatorSet = requiredSemvers.join(' ');
  const releases = Object.keys(solcList.releases);
  const maxRelease = semver.maxSatisfying(releases, comparatorSet);
  if (maxRelease) return getBuild(maxRelease);

  // If user asked for a specific version, look for it
  if (requiredSemvers.length === 1) {
    const build = reverse(solcList.builds)
      .find(b => b.path.startsWith(`soljson-v${requiredSemvers[0]}`));
    if (build) return build;
  }

  throw new Error(`Could not find a compiler that matches required versions (${comparatorSet})`);
}

async function downloadCompiler(build: SolcBuild, localFile: string) {
  const { version, keccak256, path: versionPath } = build;
  log.info(`Downloading compiler version ${version}`);
  const url = `https://solc-bin.ethereum.org/bin/${versionPath}`;
  const { data: compilerSource } = await axios.get(url);

  // Verify checksum
  const hash = '0x' + require('ethereumjs-util').keccak256(compilerSource).toString('hex');
  if (hash !== keccak256) {
    throw new Error(`Checksum of compiler downloaded from ${url} does not match (expected ${keccak256} but got ${hash})`);
  }

  // Cache downloaded source
  mkdirpSync(SOLC_CACHE_PATH);
  fs.writeFileSync(localFile, compilerSource);
}

export function getCompilerBinary(compilerPath: string) {
  // This magic is necessary as ts-node gets stuck when requiring the compiler large asm file
  // Copied from https://github.com/nomiclabs/buidler/blob/0a551dca18522ac2ac0cf2143d71580bf29f5dce/packages/buidler-core/src/internal/solidity/compiler/index.ts#L72-L89
  const Module = module.constructor as any;
  const previousHook = Module._extensions['.js'];

  Module._extensions['.js'] = function(
    module: NodeJS.Module,
    filename: string
  ) {
    const content = fs.readFileSync(filename, 'utf8');
    Object.getPrototypeOf(module)._compile.call(module, content, filename);
  };

  const loadedSolc = require(compilerPath);
  Module._extensions['.js'] = previousHook;
  return loadedSolc;
}

// Used for tests
export function setSolcCachePath(value) { SOLC_CACHE_PATH = value; }
export function setSolcBinEnv(value) { SOLC_BIN_ENV = value; }
