import { execFile, ExecException } from 'child_process';
import { Contracts, FileSystem, Logger } from 'zos-lib';
import Truffle from '../initializer/truffle/Truffle';
import { compileProject } from './solidity/SolidityProjectCompiler';
import { CompilerOptions } from './solidity/SolidityContractsCompiler';
import findUp from 'find-up';

const log = new Logger('Compiler');
const state = { alreadyCompiled: false };

const Compiler = {
  async call(force: boolean = false): Promise<void> {
    if (force || !state.alreadyCompiled) {
      await Truffle.isTruffleProject() // TODO: Check if there is a compiler setting on zos config file to decide
        ? this.compileWithTruffle(force)
        : this.compileWithSolc();
      state.alreadyCompiled = true;
    }
  },

  getSettings(): CompilerOptions {
    return this.settings || {};
  },

  setSettings(settings: CompilerOptions): void {
    this.settings = { ...this.getSettings(), ...settings };
  },

  async compileWithSolc(compilerOptions?: CompilerOptions): Promise<void> {
    const inputDir = Contracts.getLocalContractsDir();
    const outputDir = Contracts.getLocalBuildDir();
    const options = { ... this.getSettings(), ... compilerOptions };
    await compileProject(inputDir, outputDir, options);
  },

  async compileWithTruffle(): Promise<void> {
    log.info('Compiling contracts with Truffle...');
    const truffleBin: string = findUp.sync('node_modules/.bin/truffle') || 'truffle'; // attempt to load global truffle if local was not found

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
};

export default Compiler;
