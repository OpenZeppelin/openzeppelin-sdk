import path from 'path';
import { max, maxBy, pick, pickBy, omitBy, isUndefined, groupBy, sortBy, uniqBy } from 'lodash';
import glob from 'glob';
import { promisify } from 'util';
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
import { gatherSources } from './SourcesGatherer';
import { SolcBuild } from './CompilerProvider';
import { compilerVersionsMatch, compilerSettingsMatch } from '../../../utils/solidity';
import { tryFunc } from '../../../utils/try';
import { ProjectCompilerOptions } from '../ProjectCompilerOptions';

export async function compileProject(options: ProjectCompilerOptions = {}): Promise<ProjectCompileResult> {
  const projectCompiler = new SolidityProjectCompiler({
    ...options,
    inputDir: options.inputDir || Contracts.getLocalContractsDir(),
    outputDir: options.outputDir || Contracts.getLocalBuildDir(),
    workingDir: options.workingDir || process.cwd(),
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
  public contracts: RawContract[];
  public compilerOutput: CompiledContract[];
  public compilerVersion: SolcBuild;
  public options: ProjectCompilerOptions;

  public constructor(options: ProjectCompilerOptions = {}) {
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

  public get workingDir(): string {
    return this.options.workingDir;
  }

  public async call(): Promise<void> {
    const roots = await this.loadProjectSoliditySources();
    this.contracts = await this.loadSolidityDependencies(roots);

    if (this.contracts.length === 0) {
      Loggy.noSpin(__filename, 'call', 'compile-contracts', 'No contracts found to compile.');
      return;
    }

    this.compilerVersion = await resolveCompilerVersion(this.contracts, this.options);

    if (!this.shouldCompile()) {
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
    await this.writeOutput();
    Loggy.succeed(
      'compile-contracts',
      `Compiled contracts with solc ${this.compilerVersion.version} (${this.compilerVersion.build})`,
    );
  }

  private async loadProjectSoliditySources(): Promise<string[]> {
    const dir = this.inputDir;
    if (!existsSync(dir) || !lstatSync(dir).isDirectory) return [];
    return promisify(glob)('**/*.sol', { cwd: dir, absolute: true });
  }

  private async loadSolidityDependencies(roots: string[]): Promise<RawContract[]> {
    const importFiles = await gatherSources(roots, this.workingDir);
    return importFiles.map(file => ({
      fileName: path.basename(file.name),
      filePath: file.name,
      source: file.content,
      lastModified: tryFunc(() => statSync(file.url).mtimeMs),
      dependency: file.dependency,
    }));
  }

  private shouldCompile(): boolean {
    if (this.options.force) return true;
    const artifacts = this.listArtifacts();
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

  private async writeOutput(): Promise<void> {
    // Create directory if not exists, or clear it of artifacts if it does,
    // preserving networks deployment info
    const networksInfo = {};
    if (!existsSync(this.outputDir)) {
      ensureDirSync(this.outputDir);
    } else {
      const artifacts = this.listArtifacts();
      await Promise.all(
        artifacts.map(async filePath => {
          const name = path.basename(filePath, '.json');
          const schema = await readJSON(filePath);
          if (schema.networks) networksInfo[name] = schema.networks;
          await unlink(filePath);
        }),
      );
    }

    // Check and warn for repeated artifacts
    const artifactsByName = groupBy(this.compilerOutput, (artifact: CompiledContract) => artifact.contractName);
    const repeatedArtifacts = Object.keys(
      pickBy(artifactsByName, (artifacts: CompiledContract[]) => artifacts.length > 1),
    );
    if (repeatedArtifacts.length > 0) {
      for (const repeatedArtifact of repeatedArtifacts) {
        Loggy.noSpin.warn(
          __filename,
          'writeOutput',
          `repeated-artifact-${repeatedArtifact}`,
          `There is more than one contract named ${repeatedArtifact}. The compiled artifact for only one of them will be generated.`,
        );
      }
    }

    // Delete repeated artifacts, sorting them by local first, assuming that artifacts from dependencies are less used
    const sortedArtifactsByLocal = sortBy(
      this.compilerOutput,
      (artifact: CompiledContract) => this.contracts.find(c => c.filePath === artifact.sourcePath)?.dependency ?? '',
    );
    const uniqueArtifacts = uniqBy(sortedArtifactsByLocal, (artifact: CompiledContract) => artifact.contractName);

    // Write compiler output, saving networks info if present
    await Promise.all(
      uniqueArtifacts.map(async (data: CompiledContract) => {
        const name = data.contractName;
        const buildFileName = `${this.outputDir}/${name}.json`;
        if (networksInfo[name]) Object.assign(data, { networks: networksInfo[name] });
        await writeJson(buildFileName, data, { spaces: 2 });
        return { filePath: buildFileName, contractName: name };
      }),
    );
  }

  private listArtifacts(): string[] {
    if (!existsSync(this.outputDir)) return [];
    return readdirSync(this.outputDir)
      .map(fileName => path.resolve(this.outputDir, fileName))
      .filter(fileName => !lstatSync(fileName).isDirectory())
      .filter(fileName => path.extname(fileName) === '.json');
  }
}
