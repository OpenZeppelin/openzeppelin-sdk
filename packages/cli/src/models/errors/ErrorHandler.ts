import path from 'path';
import { Command } from 'commander';
import { Loggy, LogType, SpinnerAction } from 'zos-lib';
import ScriptError from './ScriptError';

const fileName = path.basename(__filename);

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
      Loggy.stopAll(SpinnerAction.Fail);
      const errorMessage = this.error.message || GENERIC_ERROR_MESSAGE;
      Loggy.add(`${fileName}#call`, 'error-message', errorMessage, {
        logType: LogType.Err,
        spinnerAction: SpinnerAction.NonSpinnable,
      });
    } else {
      Loggy.add(`${fileName}#call`, 'error-message', this.error.stack, {
        logType: LogType.Err,
        spinnerAction: SpinnerAction.NonSpinnable,
      });
    }
    if (this.error.cb) this.error.cb();

    process.exit(1);
  }
}
