import path from 'path';
import max from 'lodash.max';
import { statSync } from 'fs';
import { FileSystem as fs } from 'zos-lib';
import SolidityContractsCompiler, { RawContract, CompiledContract, CompilerOptions } from './SolidityContractsCompiler';
import { ImportsFsEngine } from '@resolver-engine/imports-fs';
import { gatherSources } from './ResolverEngineGatherer';
import { Logger } from '../../../../../lib/lib';

const log = new Logger('SolidityProjectCompiler');

export default class SolidityProjectCompiler {

  public inputDir: string;
  public outputDir: string;
  public roots: string[];
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
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
    this._loadSoliditySourcesFromDir();
    await this._loadDependencies();
    if (!this._shouldCompile()) {
      log.info('Nothing to compile, all contracts are up to date.');
      return;
    }
    await this._compile();
    this._writeOutput();
  }

  private _loadSoliditySourcesFromDir(dir = this.inputDir): void {
    fs.readDir(dir).forEach((fileName) => {
      const filePath = path.resolve(dir, fileName);
      if (fs.isDir(filePath)) this._loadSoliditySourcesFromDir(filePath);
      else if (this._isSolidityFile(filePath)) this.roots.push(filePath);
    });
  }

  private async _loadDependencies() {
    const importFiles = await gatherSources(this.roots, this.inputDir, ImportsFsEngine());
    this.contracts = importFiles.map(file => ({
      fileName: path.basename(file.url),
      filePath: file.url,
      source: file.source,
      lastModified: this._tryGetLastModified(file.url)
    }));
  }

  private _tryGetLastModified(filePath: string): Date {
    try {
      return statSync(filePath).mtime;
    } catch {
      return null;
    }
  }

  private async _compile(): Promise<void> {
    const solidityCompiler = new SolidityContractsCompiler(this.contracts, this.options);
    this.compilerOutput = await solidityCompiler.call();
  }

  private _shouldCompile(): boolean {
    const artifactsMtimes = this._listArtifacts()
      .map(filePath => statSync(filePath).mtime);
    const sourcesMtimes = this.contracts
      .map(contract => contract.lastModified);

    // Compile if there are no previous artifacts, or no mtimes could be collected for sources,
    // or sources were modified after artifacts
    // TODO: Check for changes in solc version or compiler settings
    return !max(artifactsMtimes) || !max(sourcesMtimes)
      || max(artifactsMtimes) < max(sourcesMtimes);
  }

  private _writeOutput(): void {
    if (!fs.exists(this.outputDir)) fs.createDirPath(this.outputDir);
    else this._listArtifacts().forEach(filePath => fs.remove(filePath));
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

  private _isSolidityFile(fileName: string): boolean {
    const solidityExtension = '.sol';
    const fileExtension = path.extname(fileName).toLowerCase();
    return fileExtension === solidityExtension;
  }
}
