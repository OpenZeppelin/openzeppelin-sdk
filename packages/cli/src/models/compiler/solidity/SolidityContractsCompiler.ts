import path from 'path';
import { flatMap } from 'lodash';
import semver from 'semver';
import { Loggy } from '@openzeppelin/upgrades';
import solc, {
  CompilerOptimizerOptions,
  CompilerSettings,
  Compiler,
  CompilerOutput,
  CompilerInput,
  CompilerBytecodeOutput,
  CompilerInfo,
} from 'solc-wrapper';
import {
  getCompiler as getSolc,
  resolveCompilerVersion as resolveSolc,
  SolcBuild,
  fetchCompiler,
  SolcCompiler,
} from './CompilerProvider';
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
  compiler: CompilerInfo;
}

export interface RawContract {
  fileName: string;
  filePath: string;
  source: string;
  lastModified?: number;
}

export interface CompilerVersionOptions {
  optimizer?: CompilerOptimizerOptions;
  evmVersion?: string;
}

export interface CompilerOptions extends CompilerVersionOptions {
  version?: string;
}

export function defaultEVMVersion(version) {
  return semver.gte(version.split('+')[0], '0.5.5') ? 'petersburg' : 'byzantium';
}

export const DEFAULT_OPTIMIZER = { enabled: false };

const OUTPUT_SELECTION = {
  '*': {
    '': ['ast'],
    '*': [
      'abi',
      'evm.bytecode.object',
      'evm.bytecode.sourceMap',
      'evm.deployedBytecode.object',
      'evm.deployedBytecode.sourceMap',
    ],
  },
};

export async function compile(contracts: RawContract[], options: CompilerOptions = {}): Promise<CompiledContract[]> {
  const version = await resolveCompilerVersion(contracts, options);
  const compiler = await fetchCompiler(version);
  return new SolidityContractsCompiler(compiler, contracts, options).call();
}

export async function resolveCompilerVersion(
  contracts: RawContract[],
  options: CompilerOptions = {},
): Promise<SolcBuild> {
  return resolveSolc(options.version || contracts.map(c => getPragma(c.source)));
}

export async function compileWith(
  compilerVersion: SolcBuild,
  contracts: RawContract[],
  options: CompilerVersionOptions = {},
): Promise<CompiledContract[]> {
  const compiler = await fetchCompiler(compilerVersion);
  return new SolidityContractsCompiler(compiler, contracts, options).call();
}

class SolidityContractsCompiler {
  public errors: any[];
  public contracts: RawContract[];
  public optimizer: CompilerOptimizerOptions;
  public evmVersion: string;
  public settings: CompilerSettings;
  public compiler: SolcCompiler;

  public constructor(
    compiler: SolcCompiler,
    contracts: RawContract[],
    { optimizer, evmVersion }: CompilerVersionOptions = {},
  ) {
    this.errors = [];
    this.contracts = contracts;
    this.optimizer = optimizer || DEFAULT_OPTIMIZER;
    this.evmVersion = evmVersion || defaultEVMVersion(compiler.version());
    this.compiler = compiler;
    this.settings = {
      optimizer: this.optimizer,
      evmVersion: this.evmVersion,
      outputSelection: OUTPUT_SELECTION,
    };
  }

  public async call(): Promise<CompiledContract[]> {
    // TODO: Support docker compiler
    const solcOutput = await this._compile();
    return this._buildContractsSchemas(solcOutput);
  }

  private async _compile(): Promise<CompilerOutput | never> {
    const input = this._buildCompilerInput();
    const output = await this.compiler.compile(input);

    const outputErrors = output.errors || [];
    if (outputErrors.length === 0) return output;

    const errors = outputErrors.filter(finding => finding.severity !== 'warning');
    const warnings = outputErrors.filter(finding => finding.severity === 'warning');
    const errorMessages = errors.map(error => error.formattedMessage).join('\n');
    const warningMessages = warnings.map(warning => warning.formattedMessage).join('\n');

    if (warnings.length > 0)
      Loggy.noSpin.warn(__filename, '_compile', `compile-warnings`, `Compilation warnings: \n${warningMessages}`);
    if (errors.length > 0) throw Error(`Compilation errors: \n${errorMessages}`);
    return output;
  }

  private _buildCompilerInput(): CompilerInput {
    return {
      language: 'Solidity',
      settings: this.settings,
      sources: this._buildSources(),
    };
  }

  private _buildSources(): { [filePath: string]: { content: string } } {
    return this.contracts.reduce((sources, contract) => {
      Loggy.onVerbose(
        __filename,
        '_buildSources',
        `compile-contract-file-${contract.fileName}`,
        `Compiling ${contract.fileName}`,
      );
      sources[contract.filePath] = { content: contract.source };
      return sources;
    }, {});
  }

  private _buildContractsSchemas(solcOutput: CompilerOutput): CompiledContract[] {
    const paths = Object.keys(solcOutput.contracts);
    return flatMap(paths, (fileName: string) => {
      const contractNames = Object.keys(solcOutput.contracts[fileName]);
      return contractNames.map(contractName => this._buildContractSchema(solcOutput, fileName, contractName));
    });
  }

  private _buildContractSchema(solcOutput: CompilerOutput, filePath: string, contractName: string): CompiledContract {
    const output = solcOutput.contracts[filePath][contractName];
    const source = solcOutput.sources[filePath];
    const fileName = path.basename(filePath);
    const contract = this.contracts.find(aContract => aContract.filePath === filePath);

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
      },
    };
  }

  private _solveLibraryLinks(outputBytecode: CompilerBytecodeOutput): string {
    const librariesPaths = Object.keys(outputBytecode.linkReferences);
    if (librariesPaths.length === 0) return outputBytecode.object;
    const links = librariesPaths.map(path => outputBytecode.linkReferences[path]);
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
