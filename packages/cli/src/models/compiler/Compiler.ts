import { execFile, ExecException } from 'child_process';
import { Contracts, FileSystem, Logger } from 'zos-lib';
import Truffle from '../initializer/truffle/Truffle';
import SolidityProjectCompiler from './solidity/SolidityProjectCompiler';
import { CompilerOptions } from './solidity/SolidityContractsCompiler';

const log = new Logger('Compiler');
const state = { alreadyCompiled: false };

const Compiler = {
  async call(force: boolean = false): Promise<{ stdout: string, stderr: string } | void> {
    if (force || !state.alreadyCompiled) {
      return Truffle.isTruffleProject()
        ? this.compileWithTruffle(force)
        : this.compileWithSolc();
    }
  },

  getSettings(): CompilerOptions {
    return this.settings || {};
  },

  setSettings(settings: CompilerOptions): void {
    this.settings = { ...this.getSettings(), ...settings };
  },

  async compileWithSolc(): Promise<void> {
    const inputDir = Contracts.getLocalContractsDir();
    const outputDir = Contracts.getLocalBuildDir();
    const options = this.getSettings();
    const projectCompiler = new SolidityProjectCompiler(inputDir, outputDir, options);
    log.info('Compiling contracts with solc...');
    await projectCompiler.call();
  },

  async compileWithTruffle(): Promise<{ stdout: string, stderr: string }> {
    log.info('Compiling contracts with Truffle...');
    let truffleBin = `${process.cwd()}/node_modules/.bin/truffle`;
    if (!FileSystem.exists(truffleBin)) truffleBin = 'truffle'; // Attempt to load global truffle if local was not found

    return new Promise((resolve, reject) => {
      const args: object = { shell: true };

      execFile(truffleBin, ['compile', '--all'], args, (error: ExecException, stdout, stderr) => {

        if (error) {
          if (error.code === 127) console.error('Could not find truffle executable. Please install it by running: npm install truffle');
          reject(error);
        } else {
          state.alreadyCompiled = true;
          resolve({ stdout, stderr });
        }
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      });
    });
  }
};

export default Compiler;
