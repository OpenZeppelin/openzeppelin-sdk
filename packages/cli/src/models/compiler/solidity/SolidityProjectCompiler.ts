import path from 'path';
import max from 'lodash.max';
import maxBy from 'lodash.maxby';
import pick from 'lodash.pick';
import omitBy from 'lodash.omitby';
import isUndefined from 'lodash.isundefined';
import { readJsonSync, ensureDirSync, writeJsonSync } from 'fs-extra';
import { statSync, existsSync, unlinkSync, readdirSync, lstatSync } from 'fs';
import { Loggy, Contracts } from 'zos-lib';
import {
  RawContract,
  CompiledContract,
  CompilerOptions,
  resolveCompilerVersion,
  compileWith,
  DEFAULT_OPTIMIZER,
  DEFAULT_EVM_VERSION,
} from './SolidityContractsCompiler';
import { ImportsFsEngine } from '@resolver-engine/imports-fs';
import { gatherSources } from './ResolverEngineGatherer';
import { SolcBuild } from './CompilerProvider';
import {
  compilerVersionsMatch,
  compilerSettingsMatch,
} from '../../../utils/solidity';
import { tryFunc } from '../../../utils/try';

export async function compileProject(
  options: ProjectCompilerOptions = {},
): Promise<ProjectCompileResult> {
  const inputDir = options.inputDir || Contracts.getLocalContractsDir();
  const outputDir = options.outputDir || Contracts.getLocalBuildDir();
  const projectCompiler = new SolidityProjectCompiler(
    inputDir,
    outputDir,
    options,
  );
  await projectCompiler.call();
  return {
    contracts: projectCompiler.contracts,
    compilerVersion: projectCompiler.compilerVersion,
  };
}

export interface ProjectCompilerOptions extends CompilerOptions {
  manager?: string;
  inputDir?: string;
  outputDir?: string;
}

export interface ProjectCompileResult {
  compilerVersion: SolcBuild;
  contracts: RawContract[];
}

class SolidityProjectCompiler {
  public inputDir: string;
  public outputDir: string;
  public roots: string[];
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
  public compilerVersion: SolcBuild;
  public options: CompilerOptions;

  public constructor(
    inputDir: string,
    outputDir: string,
    options: CompilerOptions = {},
  ) {
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

    if (this.contracts.length === 0) {
      Loggy.noSpin(
        __filename,
        'call',
        'compile-contracts',
        'No contracts found to compile.',
      );
      return;
    }

    await this._resolveCompilerVersion();

    if (!this._shouldCompile()) {
      Loggy.noSpin(
        __filename,
        'call',
        `compile-contracts`,
        'Nothing to compile, all contracts are up to date.',
      );
      return;
    }

    Loggy.spin(
      __filename,
      'call',
      'compile-contracts',
      `Compiling contracts with solc ${this.compilerVersion.version} (${
        this.compilerVersion.build
      })`,
    );
    this.compilerOutput = await compileWith(
      this.compilerVersion,
      this.contracts,
      this.options,
    );
    this._writeOutput();
    Loggy.succeed(
      'compile-contracts',
      `Compiled contracts with solc ${this.compilerVersion.version} (${
        this.compilerVersion.build
      })`,
    );
  }

  private _loadSoliditySourcesFromDir(dir = this.inputDir): void {
    // TODO: Replace by a glob expression
    readdirSync(dir).forEach(fileName => {
      const filePath = path.resolve(dir, fileName);
      if (lstatSync(filePath).isDirectory()) {
        this._loadSoliditySourcesFromDir(filePath);
      } else if (path.extname(filePath).toLowerCase() === '.sol') {
        this.roots.push(filePath);
      }
    });
  }

  private async _loadDependencies() {
    const importFiles = await gatherSources(
      this.roots,
      this.inputDir,
      ImportsFsEngine(),
    );
    const cwd = process.cwd();
    this.contracts = importFiles.map(file => ({
      fileName: path.basename(file.url),
      filePath: path.isAbsolute(file.url)
        ? path.relative(cwd, file.url)
        : file.url,
      source: file.source,
      lastModified: tryFunc(() => statSync(file.url).mtimeMs),
    }));
  }

  private async _resolveCompilerVersion() {
    this.compilerVersion = await resolveCompilerVersion(
      this.contracts,
      this.options,
    );
  }

  private _shouldCompile(): boolean {
    const artifacts = this._listArtifacts();
    const artifactsWithMtimes = artifacts.map(artifact => ({
      artifact,
      mtime: statSync(artifact).mtimeMs,
    }));

    // We pick a single artifact (the most recent one) to get the version it was compiled with
    const latestArtifact = maxBy(artifactsWithMtimes, 'mtime');
    const latestSchema =
      latestArtifact && readJsonSync(latestArtifact.artifact);
    const artifactCompiledVersion =
      latestSchema && latestSchema.compiler.version;
    const artifactSettings =
      latestSchema && pick(latestSchema.compiler, 'evmVersion', 'optimizer');

    // Build current settings based on defaults
    const currentSettings = {
      optimizer: DEFAULT_OPTIMIZER,
      evmVersion: DEFAULT_EVM_VERSION,
      ...omitBy(this.options, isUndefined),
    };

    // Gather artifacts vs sources modified times
    const maxArtifactsMtimes = max(
      artifactsWithMtimes.map(({ mtime }) => mtime),
    );
    const maxSourcesMtimes = max(
      this.contracts.map(({ lastModified }) => lastModified),
    );

    // Compile if there are no previous artifacts, or no mtimes could be collected for sources,
    // or sources were modified after artifacts, or compiler version changed, or compiler settings changed
    return (
      !maxArtifactsMtimes ||
      !maxSourcesMtimes ||
      maxArtifactsMtimes < maxSourcesMtimes ||
      !artifactCompiledVersion ||
      !compilerVersionsMatch(
        artifactCompiledVersion,
        this.compilerVersion.longVersion,
      ) ||
      !compilerSettingsMatch(currentSettings, artifactSettings)
    );
  }

  private _writeOutput(): void {
    // Create directory if not exists, or clear it of artifacts if it does
    if (!existsSync(this.outputDir)) ensureDirSync(this.outputDir);
    else this._listArtifacts().forEach(filePath => unlinkSync(filePath));

    // Write compiler output
    this.compilerOutput.forEach(data => {
      const buildFileName = `${this.outputDir}/${data.contractName}.json`;
      writeJsonSync(buildFileName, data);
    });
  }

  private _listArtifacts(): string[] {
    if (!existsSync(this.outputDir)) return [];
    return readdirSync(this.outputDir)
      .map(fileName => path.resolve(this.outputDir, fileName))
      .filter(fileName => !lstatSync(fileName).isDirectory())
      .filter(fileName => path.extname(fileName) === '.json');
  }
}
