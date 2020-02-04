import { execFile as callbackExecFile, ExecException } from 'child_process';
import { Loggy, Contracts } from '@openzeppelin/upgrades';
import Truffle from '../config/TruffleConfig';
import { compileProject, ProjectCompileResult } from './solidity/SolidityProjectCompiler';
import { ProjectCompilerOptions } from './ProjectCompilerOptions';
import findUp from 'find-up';
import ProjectFile from '../files/ProjectFile';
import { promisify } from 'util';
import { merge } from 'lodash';
import typechain from './Typechain';

const state = { alreadyCompiled: false };
const execFile = promisify(callbackExecFile);

export async function compile(
  compilerOptions?: ProjectCompilerOptions,
  projectFile = new ProjectFile(),
  force = false,
): Promise<void> {
  if (!force && state.alreadyCompiled) return;

  // Merge config file compiler options with those set explicitly
  const resolvedOptions: ProjectCompilerOptions = {
    optimizer: {
      enabled: false,
      runs: 200,
    },
    inputDir: Contracts.getLocalContractsDir(),
    outputDir: Contracts.getLocalBuildDir(),
  };
  merge(resolvedOptions, projectFile.compilerOptions, compilerOptions);

  // Validate compiler manager setting
  const { manager } = resolvedOptions;
  if (manager && manager !== 'truffle' && manager !== 'zos' && manager !== 'openzeppelin') {
    throw new Error(`Unknown compiler manager '${manager}' (valid values are 'openzeppelin' or 'truffle')`);
  }

  // We use truffle if set explicitly, or if nothing was set but there is a truffle.js file
  const useTruffle = manager === 'truffle' || (!manager && Truffle.isTruffleProject());

  // Compile! We use the exports syntax so we can stub them out during tests (nasty, but works!)
  const { compileWithTruffle, compileWithSolc } = exports;
  const compilePromise = useTruffle ? compileWithTruffle() : compileWithSolc(resolvedOptions);
  const compileResult = await compilePromise;
  const compileVersion = compileResult && compileResult.compilerVersion && compileResult.compilerVersion.version;
  const compileVersionOptions = compileVersion ? { version: compileVersion } : null;

  // Run typechain if requested
  if (resolvedOptions.typechain && resolvedOptions.typechain.enabled) {
    const result = compileResult as ProjectCompileResult;
    const filesList = result && result.artifacts ? result.artifacts.map(c => c.contractName).join(',') : '*';
    const filesGlob = `${resolvedOptions.outputDir}/${filesList}.json`;
    await typechain(filesGlob, resolvedOptions.typechain.outDir, resolvedOptions.typechain.target);
  }

  // If compiled successfully, write back compiler settings to project.json to persist them
  projectFile.setCompilerOptions({
    ...resolvedOptions,
    ...compileVersionOptions,
    manager: useTruffle ? 'truffle' : 'openzeppelin',
  });
  if (projectFile.exists()) projectFile.write();

  // Avoid multiple compilations per CLI run
  state.alreadyCompiled = true;
}

export async function compileWithSolc(compilerOptions?: ProjectCompilerOptions): Promise<ProjectCompileResult> {
  return compileProject(compilerOptions);
}

export async function compileWithTruffle(): Promise<void> {
  Loggy.spin(
    __filename,
    'compileWithTruffle',
    `compile-contracts`,
    'Compiling contracts with Truffle, using settings from truffle.js file',
  );
  // Attempt to load global truffle if local was not found
  const truffleBin: string = (await findUp('node_modules/.bin/truffle')) || 'truffle';

  let stdout: string, stderr: string;
  try {
    const args: object = { shell: true };
    ({ stdout, stderr } = await execFile(truffleBin, ['compile', '--all'], args));
  } catch (error) {
    if (error.code === 127) {
      Loggy.fail(
        'compile-contracts',
        'Could not find truffle executable. Please install it by running: npm install truffle',
      );
      ({ stdout, stderr } = error);
      throw error;
    }
  } finally {
    Loggy.succeed(`compile-contracts`);
    if (stdout) console.log(`Truffle output:\n ${stdout}`);
    if (stderr) console.log(`Truffle output:\n ${stderr}`);
  }
}

// Used for tests
export function resetState(): void {
  state.alreadyCompiled = false;
}
