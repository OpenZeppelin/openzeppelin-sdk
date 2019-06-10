import path from 'path';
import { execFile as callbackExecFile, ExecException } from 'child_process';
import { Loggy } from 'zos-lib';
import Truffle from '../config/TruffleConfig';
import {
  compileProject,
  ProjectCompilerOptions,
} from './solidity/SolidityProjectCompiler';
import findUp from 'find-up';
import ZosPackageFile from '../files/ZosPackageFile';
import { promisify } from 'util';

const fileName = path.basename(__filename);
const state = { alreadyCompiled: false };
const execFile = promisify(callbackExecFile);

export async function compile(
  compilerOptions?: ProjectCompilerOptions,
  packageFile = new ZosPackageFile(),
  force: boolean = false,
): Promise<void> {
  if (!force && state.alreadyCompiled) return;

  // Merge config file compiler options with those set explicitly
  compilerOptions = { ...packageFile.compilerOptions, ...compilerOptions };

  // Validate compiler manager setting
  const { manager } = compilerOptions;
  if (manager && manager !== 'truffle' && manager !== 'zos') {
    throw new Error(
      `Unknown compiler manager '${manager}' (valid values are 'zos' or 'truffle')`,
    );
  }

  // We use truffle if set explicitly, or if nothing was set but there is a truffle.js file
  const useTruffle =
    manager === 'truffle' || (!manager && Truffle.isTruffleProject());

  // Compile! We use the exports syntax so we can stub them out during tests (nasty, but works!)
  const { compileWithTruffle, compileWithSolc } = exports;
  const compilePromise = useTruffle
    ? compileWithTruffle()
    : compileWithSolc(compilerOptions);
  await compilePromise;

  // If compiled successfully, write back compiler settings to zos.json to persist them
  packageFile.setCompilerOptions({
    ...compilerOptions,
    manager: useTruffle ? 'truffle' : 'zos',
  });
  packageFile.write();

  state.alreadyCompiled = true;
}

export async function compileWithSolc(
  compilerOptions?: ProjectCompilerOptions,
): Promise<void> {
  await compileProject(compilerOptions);
}

export async function compileWithTruffle(): Promise<void> {
  Loggy.add(
    `${fileName}#compileWithTruffle`,
    `compile-contracts`,
    'Compiling contracts with Truffle, using settings from truffle.js file',
  );
  // Attempt to load global truffle if local was not found
  const truffleBin: string =
    (await findUp('node_modules/.bin/truffle')) || 'truffle';

  let stdout: string, stderr: string;
  try {
    const args: object = { shell: true };
    ({ stdout, stderr } = await execFile(
      truffleBin,
      ['compile', '--all'],
      args,
    ));
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
