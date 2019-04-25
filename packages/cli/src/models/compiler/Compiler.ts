import { execFile, ExecException } from 'child_process';
import { FileSystem, Logger } from 'zos-lib';

const log = new Logger('Compiler');

const state = { alreadyCompiled: false };

const Compiler = {
  async call(force: boolean = false): Promise<{ stdout: string, stderr: string }> {
    if (force || !state.alreadyCompiled) {
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
  }
};

export default Compiler;
