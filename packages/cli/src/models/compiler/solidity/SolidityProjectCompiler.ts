import path from 'path';
import { max, maxBy, pick, omitBy, isUndefined } from 'lodash';
import { readJsonSync, ensureDirSync, readJSON, writeJson, unlink } from 'fs-extra';
import { statSync, existsSync, readdirSync, lstatSync } from 'fs';
import { Loggy, Contracts } from '@openzeppelin/upgrades';
import {
  RawContract,
  CompiledContract,
  resolveCompilerVersion,
  compileWith,
  DEFAULT_OPTIMIZER,
  defaultEVMVersion,
} from './SolidityContractsCompiler';
import { ImportsFsEngine } from '@openzeppelin/resolver-engine-imports-fs';
import { gatherSources } from './ResolverEngineGatherer';
import { SolcBuild } from './CompilerProvider';
import { compilerVersionsMatch, compilerSettingsMatch } from '../../../utils/solidity';
import { tryFunc } from '../../../utils/try';
import { ProjectCompilerOptions } from '../ProjectCompilerOptions';

export async function compileProject(options: ProjectCompilerOptions = {}): Promise<ProjectCompileResult> {
  const projectCompiler = new SolidityProjectCompiler({
    ...options,
    inputDir: options.inputDir || Contracts.getLocalContractsDir(),
    outputDir: options.outputDir || Contracts.getLocalBuildDir(),
  });

  await projectCompiler.call();
  return {
    contracts: projectCompiler.contracts,
    compilerVersion: projectCompiler.compilerVersion,
    artifacts: projectCompiler.compilerOutput,
  };
}

export interface ProjectCompileResult {
  compilerVersion: SolcBuild;
  contracts: RawContract[];
  artifacts: CompiledContract[];
}

class SolidityProjectCompiler {
  public roots: string[];
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
  public compilerVersion: SolcBuild;
  public options: ProjectCompilerOptions;

  public constructor(options: ProjectCompilerOptions = {}) {
    this.roots = [];
    this.contracts = [];
    this.compilerOutput = [];
    this.options = options;
  }

  public get inputDir(): string {
    return this.options.inputDir;
  }

  public get outputDir(): string {
    return this.options.outputDir;
  }

  public async call(): Promise<void> {
    await this._loadSoliditySourcesFromDir();
    await this._loadDependencies();

    if (this.contracts.length === 0) {
      Loggy.noSpin(__filename, 'call', 'compile-contracts', 'No contracts found to compile.');
      return;
    }

    await this._resolveCompilerVersion();

    if (!this._shouldCompile()) {
      Loggy.noSpin(__filename, 'call', `compile-contracts`, 'Nothing to compile, all contracts are up to date.');
      return;
    }

    Loggy.spin(
      __filename,
      'call',
      'compile-contracts',
      `Compiling contracts with solc ${this.compilerVersion.version} (${this.compilerVersion.build})`,
    );
    this.compilerOutput = await compileWith(this.compilerVersion, this.contracts, this.options);
    await this._writeOutput();
    Loggy.succeed(
      'compile-contracts',
      `Compiled contracts with solc ${this.compilerVersion.version} (${this.compilerVersion.build})`,
    );
  }

  private _loadSoliditySourcesFromDir(dir = this.inputDir): void {
    if (!existsSync(dir) || !lstatSync(dir).isDirectory) return;

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
    const importFiles = await gatherSources(this.roots, this.inputDir, ImportsFsEngine());
    const cwd = process.cwd();
    this.contracts = importFiles.map(file => ({
      fileName: path.basename(file.url),
      filePath: path.isAbsolute(file.url) ? path.relative(cwd, file.url) : file.url,
      source: file.source,
      lastModified: tryFunc(() => statSync(file.url).mtimeMs),
    }));
  }

  private async _resolveCompilerVersion() {
    this.compilerVersion = await resolveCompilerVersion(this.contracts, this.options);
  }

  private _shouldCompile(): boolean {
    if (this.options.force) return true;
    const artifacts = this._listArtifacts();
    const artifactsWithMtimes = artifacts.map(artifact => ({
      artifact,
      mtime: statSync(artifact).mtimeMs,
    }));

    // We pick a single artifact (the most recent one) to get the version it was compiled with
    const latestArtifact = maxBy(artifactsWithMtimes, 'mtime');
    const latestSchema = latestArtifact && readJsonSync(latestArtifact.artifact);
    const artifactCompiledVersion = latestSchema && latestSchema.compiler.version;
    const artifactSettings = latestSchema && pick(latestSchema.compiler, 'evmVersion', 'optimizer');

    // Build current settings based on defaults
    const currentSettings = {
      optimizer: DEFAULT_OPTIMIZER,
      evmVersion: defaultEVMVersion(this.compilerVersion.longVersion),
      ...omitBy(this.options, isUndefined),
    };

    // Gather artifacts vs sources modified times
    const maxArtifactsMtimes = latestArtifact && latestArtifact.mtime;
    const maxSourcesMtimes = max(this.contracts.map(({ lastModified }) => lastModified));

    // Compile if there are no previous artifacts, or no mtimes could be collected for sources,
    // or sources were modified after artifacts, or compiler version changed, or compiler settings changed
    return (
      !maxArtifactsMtimes ||
      !maxSourcesMtimes ||
      maxArtifactsMtimes <= maxSourcesMtimes ||
      !artifactCompiledVersion ||
      !compilerVersionsMatch(artifactCompiledVersion, this.compilerVersion.longVersion) ||
      !compilerSettingsMatch(currentSettings, artifactSettings)
    );
  }

  private async _writeOutput(): Promise<void> {
    // Create directory if not exists, or clear it of artifacts if it does,
    // preserving networks deployment info
    const networksInfo = {};
    if (!existsSync(this.outputDir)) {
      ensureDirSync(this.outputDir);
    } else {
      const artifacts = this._listArtifacts();
      await Promise.all(
        artifacts.map(async filePath => {
          const name = path.basename(filePath, '.json');
          const schema = await readJSON(filePath);
          if (schema.networks) networksInfo[name] = schema.networks;
          await unlink(filePath);
        }),
      );
    }

    // Write compiler output, saving networks info if present
    await Promise.all(
      this.compilerOutput.map(async data => {
        const name = data.contractName;
        const buildFileName = `${this.outputDir}/${name}.json`;
        if (networksInfo[name]) Object.assign(data, { networks: networksInfo[name] });
        await writeJson(buildFileName, data, { spaces: 2 });
        return { filePath: buildFileName, contractName: name };
      }),
    );
  }

  private _listArtifacts(): string[] {
    if (!existsSync(this.outputDir)) return [];
    return readdirSync(this.outputDir)
      .map(fileName => path.resolve(this.outputDir, fileName))
      .filter(fileName => !lstatSync(fileName).isDirectory())
      .filter(fileName => path.extname(fileName) === '.json');
  }
}
