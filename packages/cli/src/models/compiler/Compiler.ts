import { exec } from 'child_process';
import { FileSystem, Contracts, Logger } from 'zos-lib';

const log = new Logger('Compiler');

const Compiler = {
  async call(): Promise<{ stdout: string, stderr: string }> {
    log.info('Compiling contracts with Truffle...');
    const truffleBin = `${process.cwd()}/node_modules/.bin/truffle`;
    if (!FileSystem.exists(truffleBin)) throw new Error(`Could not find truffle in ${truffleBin}. Please make sure you're placed in the right directory.`);

    return new Promise((resolve, reject) => {
      exec(`${truffleBin} compile --all`, (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        error ? reject(error) : resolve({ stdout, stderr });
      });
    });
  }
};

export default Compiler;
