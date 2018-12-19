import path from 'path';
import { FileSystem as fs } from 'zos-lib';
import SolidityContractsCompiler, { RawContract, CompiledContract, CompilerOptions } from './SolidityContractsCompiler';

export default class SolidityProjectCompiler {

  public inputDir: string;
  public outputDir: string;
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
  public options: CompilerOptions;

  constructor(inputDir: string, outputDir: string, options: CompilerOptions = {}) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.contracts = [];
    this.compilerOutput = [];
    this.options = options;
  }

  public async call(): Promise<void> {
    this._loadSoliditySourcesFromDir(this.inputDir);
    await this._compile();
    this._writeOutput();
  }

  private _loadSoliditySourcesFromDir(dir: string): void {
    fs.readDir(dir).forEach((fileName) => {
      const filePath = path.resolve(dir, fileName);
      if (fs.isDir(filePath)) this._loadSoliditySourcesFromDir(filePath);
      else if (this._isSolidityFile(filePath)) {
        const source = fs.read(filePath);
        const contract = { fileName, filePath, source };
        this.contracts.push(contract);
      }
    });
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
