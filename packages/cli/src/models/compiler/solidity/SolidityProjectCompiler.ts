import path from 'path';
import fsSys from 'fs';
import { FileSystem as fs } from 'zos-lib';
import SolidityContractsCompiler, { RawContract, CompiledContract, CompilerOptions } from './SolidityContractsCompiler';
import { ImportsFsEngine } from '@resolver-engine/imports-fs';
import { gatherSources } from './ResolverEngineGatherer';

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
    const importFiles = await gatherSources(this.roots, process.cwd(), ImportsFsEngine());
    this.contracts = importFiles.map(file => ({
      fileName: path.basename(file.url),
      filePath: file.url,
      source: file.source,
      lastModified: this._tryGetLastModified(file.url)
    }));
  }

  private _tryGetLastModified(filePath: string): Date {
    try {
      return fsSys.statSync(filePath).mtime;
    } catch {
      return null;
    }
  }

  private async _compile(): Promise<void> {
    const solidityCompiler = new SolidityContractsCompiler(this.contracts, this.options);
    this.compilerOutput = await solidityCompiler.call();
  }

  private _writeOutput(): void {
    if (!fs.exists(this.outputDir)) fs.createDirPath(this.outputDir);
    this.compilerOutput.forEach((data) => {
      const buildFileName = `${this.outputDir}/${data.contractName}.json`;
      fs.writeJson(buildFileName, data);
    });
  }

  private _isSolidityFile(fileName: string): boolean {
    const solidityExtension = '.sol';
    const fileExtension = path.extname(fileName).toLowerCase();
    return fileExtension === solidityExtension;
  }
}
