import chalk from 'chalk';
import Spinnies from 'spinnies';

const spinners = new Spinnies({
  spinnerColor: 'blueBright',
  succeedColor: 'blueBright',
  failColor: 'redBright',
});

export enum LogType {
  Info,
  Warn,
  Err,
}

export enum LogLevel {
  Normal,
  Verbose,
  Silent,
}

export enum LogStatus {
  Spinning = 'spinning',
  Succeed = 'succeed',
  Fail = 'fail',
  Stopped = 'stopped',
  NonSpinnable = 'non-spinnable',
}

export const Loggy = {
  silent(value: boolean): void {
    this.isSilent = value;
  },

  verbose(value: boolean): void {
    this.isVerbose = value;
  },

  add(
    file: string,
    reference: string,
    text: string,
    status: LogStatus = LogStatus.Spinning,
    logLevel: LogLevel = LogLevel.Normal,
    logType: LogType = LogType.Info,
  ): void {
    this._log(file, reference, text, status, logLevel, logType);
  },

  update(reference: string, status: LogStatus, text?: string): void {
    if (this.isSilent || this.isVerbose) return;
    spinners[status](reference, { text });
  },

  succeed(reference: string, text?: string): void {
    if (this.isSilent || this.isVerbose) return;
    spinners.succeed(reference, { text });
  },

  fail(reference: string, text?: string): void {
    if (this.isSilent || this.isVerbose) return;
    spinners.fail(reference, { text });
  },

  stopAll(status: LogStatus = LogStatus.Fail): void {
    if (this.isSilent || this.isVerbose) return;
    spinners.stopAll(status);
  },

  _log(
    file: string,
    reference: string,
    text: string,
    status: LogStatus,
    logLevel: LogLevel,
    logType: LogType,
  ): void {
    if (this.isSilent) return;
    if (this.isVerbose) {
      const color = this._getColorFor(logType);
      const message = `[${new Date().toISOString()}@${file}] ${text}`;
      console.error(chalk.keyword(color)(message));
    } else if (logLevel === LogLevel.Normal) {
      spinners.add(reference, { text, status });
    }
  },

  _getColorFor(logType: LogType): string {
    switch (logType) {
      case LogType.Info:
        return 'white';
      case LogType.Warn:
        return 'yellow';
      case LogType.Err:
        return 'red';
      default:
        return 'white';
    }
  },
};

interface LoggerOptions {
  verbose: boolean;
  silent: boolean;
}

export default class Logger {
  private _prefix: string;
  private _opts: LoggerOptions;

  private static _defaults: LoggerOptions = {
    verbose: false,
    silent: true,
  };

  public static silent(value): void {
    Logger._defaults.silent = value;
  }

  public static verbose(value): void {
    Logger._defaults.verbose = value;
  }

  public constructor(prefix: string, opts?: LoggerOptions) {
    this._prefix = prefix;
    this._opts = opts;
  }

  public info(msg: string): void {
    this.log(msg, 'green');
  }

  public warn(msg: string) {
    this.log(msg, 'yellow');
  }

  public error(msg: string, ex?: Error): void {
    if (ex && ex.message && !this.opts.verbose) {
      this.log(`${msg}: ${ex.message}`, 'red');
    } else {
      this.log(msg, 'red');
    }

    if (ex && this.opts.verbose) {
      this.error(ex.stack);
    }
  }

  public log(msg: string, color: string = ''): void {
    if (this.opts.silent) return;
    if (this.opts.verbose) msg = `[${this._prefix}] ${msg}`;
    console.error(chalk.keyword(color)(msg));
  }

  public get opts(): LoggerOptions {
    return { ...this._opts, ...Logger._defaults };
  }
}
