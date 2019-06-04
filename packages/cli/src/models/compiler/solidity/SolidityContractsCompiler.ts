import _ from 'lodash';
import { Logger } from 'zos-lib';
import solc from 'solc-wrapper';
import { getCompiler as getSolc, resolveCompilerVersion as resolveSolc, SolcBuild, fetchCompiler, SolcCompiler } from './CompilerProvider';
import { getPragma } from '../../../utils/solidity';

export interface CompiledContract {
  fileName: string;
  contractName: string;
  source: string;
  sourcePath: string;
  sourceMap: string;
  abi: any[];
  ast: any;
  legacyAST?: any;
  bytecode: string;
  deployedBytecode: string;
  deployedSourceMap: string;
  compiler: solc.CompilerInfo;
}

export interface RawContract {
  fileName: string;
  filePath: string;
  source: string;
  lastModified?: number;
}

export interface CompilerVersionOptions {
  optimizer?: solc.CompilerOptimizerOptions;
  evmVersion?: string;
}

export interface CompilerOptions extends CompilerVersionOptions {
  version?: string;
}

const log = new Logger('SolidityContractsCompiler');

export const DEFAULT_EVM_VERSION = 'constantinople';

const DEFAULT_OPTIMIZER = { enabled: false };
const OUTPUT_SELECTION = {
  '*': {
    '': [
      'ast'
    ],
    '*': [
      'abi',
      'evm.bytecode.object',
      'evm.bytecode.sourceMap',
      'evm.deployedBytecode.object',
      'evm.deployedBytecode.sourceMap'
    ]
  }
};

export async function compile(contracts: RawContract[], options: CompilerOptions = {}): Promise<CompiledContract[]> {
  const version = await resolveCompilerVersion(contracts, options);
  const compiler = await fetchCompiler(version);
  return new SolidityContractsCompiler(compiler, contracts, options).call();
}

export async function resolveCompilerVersion(contracts: RawContract[], options: CompilerOptions = {}): Promise<SolcBuild> {
  return resolveSolc(options.version || contracts.map(c => getPragma(c.source)));
}

export async function compileWith(compilerVersion: SolcBuild, contracts: RawContract[], options: CompilerVersionOptions = {}): Promise<CompiledContract[]> {
  const compiler = await fetchCompiler(compilerVersion);
  return new SolidityContractsCompiler(compiler, contracts, options).call();
}

class SolidityContractsCompiler {
  public errors: any[];
  public contracts: RawContract[];
  public optimizer: solc.CompilerOptimizerOptions;
  public evmVersion: string;
  public settings: solc.CompilerSettings;
  public compiler: SolcCompiler;

  constructor(compiler: solc.Compiler, contracts: RawContract[], { optimizer, evmVersion }: CompilerVersionOptions = {}) {
    this.errors = [];
    this.contracts = contracts;
    this.optimizer = optimizer || DEFAULT_OPTIMIZER;
    this.evmVersion = evmVersion || DEFAULT_EVM_VERSION;
    this.compiler = compiler;
    this.settings = {
      optimizer: this.optimizer,
      evmVersion: this.evmVersion,
      outputSelection: OUTPUT_SELECTION
    };
  }

  public async call(): Promise<CompiledContract[]> {
    // TODO: Support docker compiler
    const solcOutput = await this._compile();
    return this._buildContractsSchemas(solcOutput);
  }

  private async _compile(): Promise<solc.CompilerOutput | never> {
    const input = this._buildCompilerInput();
    const output = await this.compiler.compile(input);
    const outputErrors = output.errors || [];
    if (outputErrors.length === 0) return output;

    const errors = outputErrors.filter((finding) => finding.severity !== 'warning');
    const warnings = outputErrors.filter((finding) => finding.severity === 'warning');
    const errorMessages = errors.map((error) => error.formattedMessage).join('\n');
    const warningMessages = warnings.map((warning) => warning.formattedMessage).join('\n');

    if (warnings.length > 0) log.warn(`Compilation warnings: \n${warningMessages}`);
    if (errors.length > 0) throw Error(`Compilation errors: \n${errorMessages}`);
    return output;
  }

  private _buildCompilerInput(): solc.CompilerInput {
    return {
      language: 'Solidity',
      settings: this.settings,
      sources: this._buildSources(),
    };
  }

  private _buildSources(): { [filePath: string]: { content: string } } {
    return this.contracts.reduce((sources, contract) => {
      log.info(`Compiling ${contract.fileName} ...`);
      sources[contract.filePath] = { content: contract.source };
      return sources;
    }, {});
  }

  private _buildContractsSchemas(solcOutput: solc.CompilerOutput): CompiledContract[] {
    const paths = Object.keys(solcOutput.contracts);
    return _.flatMap(paths, (fileName) => {
      const contractNames = Object.keys(solcOutput.contracts[fileName]);
      return contractNames.map((contractName) => this._buildContractSchema(solcOutput, fileName, contractName));
    });
  }

  private _buildContractSchema(solcOutput: solc.CompilerOutput, fileName: string, contractName: string): CompiledContract {
    const output = solcOutput.contracts[fileName][contractName];
    const source = solcOutput.sources[fileName];
    fileName = fileName.substring(fileName.lastIndexOf('/') + 1);
    const contract = this.contracts.find((aContract) => aContract.fileName === fileName);

    return {
      fileName,
      contractName,
      source: contract.source,
      sourcePath: contract.filePath,
      sourceMap: output.evm.bytecode.sourceMap,
      deployedSourceMap: output.evm.deployedBytecode.sourceMap,
      abi: output.abi,
      ast: source.ast,
      bytecode: `0x${this._solveLibraryLinks(output.evm.bytecode)}`,
      deployedBytecode: `0x${this._solveLibraryLinks(output.evm.deployedBytecode)}`,
      compiler: {
        name: 'solc',
        version: this.compiler.version(),
        optimizer: this.optimizer,
        evmVersion: this.evmVersion,
      }
    };
  }

  private _solveLibraryLinks(outputBytecode: solc.CompilerBytecodeOutput): string {
    const librariesPaths = Object.keys(outputBytecode.linkReferences);
    if (librariesPaths.length === 0) return outputBytecode.object;
    const links = librariesPaths.map((path) => outputBytecode.linkReferences[path]);
    return links.reduce((replacedBytecode, link) => {
      return Object.keys(link).reduce((subReplacedBytecode, libraryName) => {
        const linkReferences = link[libraryName] || [];
        return this._replaceLinkReferences(subReplacedBytecode, linkReferences, libraryName);
      }, replacedBytecode);
    }, outputBytecode.object);
  }

  private _replaceLinkReferences(bytecode: string, linkReferences: any[], libraryName: string): string {
    // offset are given in bytes, we multiply it by 2 to work with character offsets
    return linkReferences.reduce((aBytecode: string, ref: any) => {
      const start = ref.start * 2;
      const length = ref.length * 2;
      let linkId = `__${libraryName}`;
      linkId += '_'.repeat(length - linkId.length);
      return aBytecode.substring(0, start) + linkId + aBytecode.substring(start + length);
    }, bytecode);
  }
}
