import chalk from 'chalk';

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
