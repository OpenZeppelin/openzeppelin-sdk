import { exec } from 'child_process';
import { FileSystem, Contracts, Logger } from 'zos-lib';

const log = new Logger('Compiler');

const Compiler = {
  async call(): Promise<{ stdout: string, stderr: string }> {
    log.info('Compiling contracts with Truffle...');
    return new Promise((resolve, reject) => {
      exec('npx truffle compile', (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve({ stdout, stderr });
      });
    });
  }
};

export default Compiler;
