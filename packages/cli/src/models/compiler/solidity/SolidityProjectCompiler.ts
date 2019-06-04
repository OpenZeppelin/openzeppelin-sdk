import path from 'path';
import max from 'lodash.max';
import maxBy from 'lodash.maxby';
import { readJsonSync } from 'fs-extra';
import { statSync } from 'fs';
import { FileSystem as fs, Logger } from 'zos-lib';
import { compile, RawContract, CompiledContract, CompilerOptions, resolveCompilerVersion } from './SolidityContractsCompiler';
import { ImportsFsEngine } from '@resolver-engine/imports-fs';
import { gatherSources } from './ResolverEngineGatherer';
import { SolcBuild } from './CompilerProvider';
import { compilerVersionMatches } from '../../../utils/solidity';
import { tryFunc } from '../../../utils/try';

const log = new Logger('SolidityProjectCompiler');

export async function compileProject(inputDir: string, outputDir: string, options: CompilerOptions = {}): Promise<void> {
  return new SolidityProjectCompiler(inputDir, outputDir, options).call();
}

class SolidityProjectCompiler {
  public inputDir: string;
  public outputDir: string;
  public roots: string[];
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
  public compilerVersion: SolcBuild;
  public options: CompilerOptions;

  constructor(inputDir: string, outputDir: string, options: CompilerOptions = {}) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.roots = [];
    this.contracts = [];
    this.compilerOutput = [];
    this.options = options;
  }

  public async call(): Promise<void> {
    await this._loadSoliditySourcesFromDir();
    await this._loadDependencies();
    await this._resolveCompilerVersion();

    if (!this._shouldCompile()) {
      log.info('Nothing to compile, all contracts are up to date.');
      return;
    }

    this.compilerOutput = await compile(this.contracts, this.options);
    this._writeOutput();
  }

  private _loadSoliditySourcesFromDir(dir = this.inputDir): void {
    fs.readDir(dir).forEach((fileName) => {
      const filePath = path.resolve(dir, fileName);
      if (fs.isDir(filePath)) this._loadSoliditySourcesFromDir(filePath);
      else if (path.extname(filePath).toLowerCase() === '.sol') this.roots.push(filePath);
    });
  }

  private async _loadDependencies() {
    const importFiles = await gatherSources(this.roots, this.inputDir, ImportsFsEngine());
    this.contracts = importFiles.map(file => ({
      fileName: path.basename(file.url),
      filePath: file.url,
      source: file.source,
      lastModified: tryFunc(() => statSync(file.url).mtimeMs)
    }));
  }

  private async _resolveCompilerVersion() {
    this.compilerVersion = await resolveCompilerVersion(this.contracts, this.options);
  }

  private _shouldCompile(): boolean {
    const artifacts = this._listArtifacts();
    const artifactsWithMtimes = artifacts
      .map(artifact => ({ artifact, mtime: statSync(artifact).mtimeMs }));

    // We pick a single artifact (the most recent one) to get the version it was compiled with
    const latestArtifact = maxBy(artifactsWithMtimes, 'mtime');
    const artifactCompiledVersion = latestArtifact && readJsonSync(latestArtifact.artifact).compiler.version;

    // Gather artifacts vs sources modified times
    const maxArtifactsMtimes = max(artifactsWithMtimes.map(({ mtime }) => mtime));
    const maxSourcesMtimes = max(this.contracts.map(({ lastModified }) => lastModified));

    // Compile if there are no previous artifacts, or no mtimes could be collected for sources,
    // or sources were modified after artifacts, or compiler version changed
    return !maxArtifactsMtimes
      || !maxSourcesMtimes
      || maxArtifactsMtimes < maxSourcesMtimes
      || !artifactCompiledVersion
      || !compilerVersionMatches(artifactCompiledVersion, this.compilerVersion.longVersion);
  }

  private _writeOutput(): void {
    // Create directory if not exists, or clear it of artifacts if it does
    if (!fs.exists(this.outputDir)) fs.createDirPath(this.outputDir);
    else this._listArtifacts().forEach(filePath => fs.remove(filePath));

    // Write compiler output
    this.compilerOutput.forEach((data) => {
      const buildFileName = `${this.outputDir}/${data.contractName}.json`;
      fs.writeJson(buildFileName, data);
    });
  }

  private _listArtifacts(): string[] {
    if (!fs.exists(this.outputDir)) return [];
    return fs.readDir(this.outputDir)
      .map(fileName => path.resolve(this.outputDir, fileName))
      .filter(fileName => !fs.isDir(fileName))
      .filter(fileName => path.extname(fileName) === '.json');
  }
}
