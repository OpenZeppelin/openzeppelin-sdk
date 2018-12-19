import _ from 'lodash';
import axios from 'axios';
import { Logger, FileSystem } from 'zos-lib';
import SolidityDependenciesFinder from './SolidityDependenciesFinder';
import solc from 'solc';

export interface CompiledContract {
  fileName: string;
  contractName: string;
  source: string;
  sourcePath: string;
  sourceMap: string;
  abi: any[];
  ast: any;
  legacyAST: any;
  bytecode: string;
  deployedBytecode: string;
  compiler: solc.CompilerInfo;
}

export interface RawContract {
  fileName: string;
  filePath: string;
  source: string;
}

export interface CompilerOptions {
  version?: string;
  optimizer?: solc.CompilerOptimizerOptions;
  evmVersion?: string;
}

const log = new Logger('SolidityContractsCompiler');

const DEFAULT_OPTIMIZER = { enabled: false };
const DEFAULT_EVM_VERSION = 'byzantium';
const VERSIONS_URL = 'https://solc-bin.ethereum.org/bin/list.json';
const OUTPUT_SELECTION = {
  '*': {
    '': [
      'legacyAST',
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

export default class SolidityContractsCompiler {

  public errors: any[];
  public contracts: RawContract[];
  public optimizer: solc.CompilerOptimizerOptions;
  public evmVersion: string;
  public version: string;
  public settings: solc.CompilerSettings;

  public static latestVersion(): string {
    return solc.version();
  }

  constructor(contracts: RawContract[], { version, optimizer, evmVersion }: CompilerOptions = {}) {
    this.errors = [];
    this.contracts = contracts;
    this.optimizer = optimizer || DEFAULT_OPTIMIZER;
    this.evmVersion = evmVersion || DEFAULT_EVM_VERSION;
    this.version = version || SolidityContractsCompiler.latestVersion();
    this.settings = {
      optimizer: this.optimizer,
      evmVersion: this.evmVersion,
      outputSelection: OUTPUT_SELECTION
    };
  }

  public async call(): Promise<CompiledContract[]> {
    const solcOutput = await this._compile();
    return this._buildContractsSchemas(solcOutput);
  }

  public async solc(): Promise<solc.Compiler> {
    if (this.version === SolidityContractsCompiler.latestVersion()) return solc;
    const version = await this._findVersion();
    const parsedVersion = version.replace('soljson-', '').replace('.js', '');
    return new Promise((resolve, reject) => {
      solc.loadRemoteVersion(parsedVersion, (error, compiler) => {
        return error ? reject(error) : resolve(compiler);
      });
    });
  }

  public async versions(): Promise<solc.CompilerVersionsInfo | never> {
    const response = await axios.request({ url: VERSIONS_URL });
    if (response.status === 200) return response.data;
    else throw Error(`Could not fetch solc versions from ${VERSIONS_URL} (status ${response.status})`);
  }

  private async _compile(): Promise<solc.CompilerOutput | never> {
    const input = this._buildCompilerInput();
    const requestedSolc = await this.solc();
    const output = requestedSolc.compile(JSON.stringify(input), (dep) => this._findDependency(dep, this));
    const parsedOutput = JSON.parse(output);
    const outputErrors = parsedOutput.errors || [];
    if (outputErrors.length === 0) return parsedOutput;

    const errors = outputErrors.filter((finding) => finding.severity !== 'warning');
    const warnings = outputErrors.filter((finding) => finding.severity === 'warning');
    const errorMessages = errors.map((error) => error.formattedMessage).join('\n');
    const warningMessages = warnings.map((warning) => warning.formattedMessage).join('\n');

    if (warnings.length > 0) log.warn(`Compilation warnings: \n${warningMessages}`);
    if (errors.length > 0) throw Error(`Compilation errors: \n${errorMessages}`);
    return parsedOutput;
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

  private _findDependency(dependencyPath: string, compiler: SolidityContractsCompiler): { content: string } | { error: string } {
    const dependencyName = dependencyPath.substring(dependencyPath.lastIndexOf('/') + 1);
    let dependencyContract = compiler.contracts.find((contract) => contract.fileName === dependencyName);
    if (!dependencyContract) dependencyContract = SolidityDependenciesFinder.call(dependencyPath);
    if (!dependencyContract) return { error: 'File not found' };
    log.info(`Compiling ${dependencyName} ...`);
    compiler.contracts.push(dependencyContract);
    return { content: dependencyContract.source };
  }

  private async _findVersion(): Promise<string | never> {
    const versions = await this.versions();
    if (versions.releases[this.version]) return versions.releases[this.version];
    const isPrerelease = this.version.includes('nightly') || this.version.includes('commit');
    if (isPrerelease) {
      const isVersion = (aBuild) => aBuild.prerelease === this.version || aBuild.build === this.version || aBuild.longVersion === this.version;
      const build = versions.builds.find(isVersion);
      if (build) return build.path;
    }
    throw Error(`Could not find version ${this.version} in ${VERSIONS_URL}`);
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
      abi: output.abi,
      ast: source.ast,
      legacyAST: source.legacyAST,
      bytecode: `0x${this._solveLibraryLinks(output.evm.bytecode)}`,
      deployedBytecode: `0x${this._solveLibraryLinks(output.evm.deployedBytecode)}`,
      compiler: {
        name: 'solc',
        version: this.version,
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
