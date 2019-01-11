import { exec } from 'child_process';
import { FileSystem, Contracts, Logger } from 'zos-lib';

const log = new Logger('Compiler');

const Compiler = {
  async call(): Promise<{ stdout: string, stderr: string }> {
    log.info('Compiling contracts with Truffle...');
    return new Promise((resolve, reject) => {
      exec(`${process.cwd()}/node_modules/.bin/truffle compile`, (error, stdout, stderr) => {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
        error ? reject(error) : resolve({ stdout, stderr })
      });
    });
  }
};

export default Compiler;
