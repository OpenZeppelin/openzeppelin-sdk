import { execFile, ExecException } from 'child_process';
import { Logger } from 'zos-lib';
import Truffle from '../initializer/truffle/Truffle';
import { compileProject, ProjectCompilerOptions } from './solidity/SolidityProjectCompiler';
import findUp from 'find-up';
import ZosPackageFile from '../files/ZosPackageFile';

const log = new Logger('Compiler');
const state = { alreadyCompiled: false };

export async function compile(compilerOptions?: ProjectCompilerOptions, packageFile = new ZosPackageFile(), force: boolean = false): Promise<void> {
  if (!force && state.alreadyCompiled) return;

  // Merge config file compiler options with those set explicitly
  compilerOptions = { ...packageFile.compilerOptions, ...compilerOptions };

  // Validate compiler manager setting
  const { manager } = compilerOptions;
  if (manager && manager !== 'truffle' && manager !== 'zos') {
    throw new Error(`Unknown compiler manager '${manager}' (valid values are 'zos' or 'truffle')`);
  }

  // We use truffle if set explicitly, or if nothing was set but there is a truffle.js file
  const useTruffle = manager === 'truffle'
    || (!manager && Truffle.isTruffleProject());

  // Compile! We use the exports syntax so we can stub them out during tests (nasty, but works!)
  const compilePromise = useTruffle
    ? exports.compileWithTruffle()
    : exports.compileWithSolc(compilerOptions);
  await compilePromise;

  // If compiled successfully, write back compiler settings to zos.json to persist them
  packageFile.setCompilerOptions({ ... compilerOptions, manager: useTruffle ? 'truffle' : 'zos' });
  packageFile.write();

  state.alreadyCompiled = true;
}

export async function compileWithSolc(compilerOptions?: ProjectCompilerOptions): Promise<void> {
  await compileProject(compilerOptions);
}

export async function compileWithTruffle(): Promise<void> {
  log.info('Compiling contracts with Truffle...');
  // Attempt to load global truffle if local was not found
  const truffleBin: string = findUp.sync('node_modules/.bin/truffle') || 'truffle';

  return new Promise((resolve, reject) => {
    const args: object = { shell: true };
    execFile(truffleBin, ['compile', '--all'], args, (error: ExecException, stdout, stderr) => {
      if (error) {
        if (error.code === 127) console.error('Could not find truffle executable. Please install it by running: npm install truffle');
        reject(error);
      } else {
        resolve();
      }
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    });
  });
}

// Used for tests
export function resetState() {
  state.alreadyCompiled = false;
}
