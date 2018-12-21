import { exec } from 'child_process';
import { FileSystem, Contracts, Logger } from 'zos-lib';
import Truffle from '../initializer/truffle/Truffle';
import SolidityProjectCompiler from './solidity/SolidityProjectCompiler';
import { CompilerOptions } from './solidity/SolidityContractsCompiler';

const log = new Logger('Compiler');

export default {
  async call(): Promise<void> {
    Truffle.isTruffleProject()
      ? this.compileWithTruffle()
      : this.compileWithSolc();
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
    return new Promise((resolve, reject) => {
      exec('npx truffle compile', (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve({ stdout, stderr });
      });
    });
  },
};
