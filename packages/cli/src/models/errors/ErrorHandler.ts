import { Command } from 'commander';
import { Loggy } from 'zos-lib';
import ScriptError from './ScriptError';

const GENERIC_ERROR_MESSAGE =
  'There was an undefined error. Please execute the same command again in verbose mode if necessary.';

export default class ErrorHandler {
  public error: ScriptError | any;
  public verbose: boolean;

  public constructor(error: ScriptError | any, { verbose }: Command) {
    this.error = error;
    this.verbose = verbose;
  }

  public call(): void {
    if (!this.verbose) {
      Loggy.stopAll();
      const errorMessage = this.error.message || GENERIC_ERROR_MESSAGE;
      Loggy.noSpin.error(__filename, 'call', 'error-message', errorMessage);
    } else {
      Loggy.noSpin.error(__filename, 'call', 'error-message', this.error.stack);
    }
    if (this.error.cb) this.error.cb();

    process.exit(1);
  }
}
