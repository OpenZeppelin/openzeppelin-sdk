import { exec } from 'child_process';
import { FileSystem, Contracts, Logger } from 'zos-lib';

const log = new Logger('Compiler');

const Compiler = {
  async call(): Promise<{ stdout: string, stderr: string }> {
    log.info('Compiling contracts with Truffle...');
    let truffleBin = `${process.cwd()}/node_modules/.bin/truffle`;
    if (!FileSystem.exists(truffleBin)) truffleBin = 'truffle'; // Attempt to load global truffle if local was not found

    return new Promise((resolve, reject) => {
      exec(`${truffleBin} compile --all`, (error, stdout, stderr) => {
        if (error) {
          if (error.code === 127) console.error('Could not find truffle executable. Please install it by running: npm install truffle');
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      });
    });
  }
};

export default Compiler;
