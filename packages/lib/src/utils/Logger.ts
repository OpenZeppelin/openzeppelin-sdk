import pickby from 'lodash.pickby';
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

export enum SpinnerAction {
  Add = 'spinning',
  Update = 'update',
  Fail = 'fail',
  Succeed = 'succeed',
  NonSpinnable = 'non-spinnable',
}

interface LogInfo {
  logType?: LogType;
  logLevel?: LogLevel;
  spinnerAction?: SpinnerAction;
}

interface UpdateParams {
  spinnerAction?: SpinnerAction;
  text?: string;
}

export const Loggy = {
  silent(value: boolean): void {
    this.isSilent = value;
  },

  verbose(value: boolean): void {
    this.isVerbose = value;
  },

  addOrUpdate(
    file: string,
    reference: string,
    text: string,
    logInfo: LogInfo = {
      logLevel: LogLevel.Normal,
      logType: LogType.Info,
      spinnerAction: SpinnerAction.Add,
    },
  ): void {
    if (this[reference]) {
      const { spinnerAction } = logInfo;
      this.update(reference, { spinnerAction, text }, file);
    } else this.add(file, reference, text, logInfo);
  },

  add(
    file: string,
    reference: string,
    text: string,
    { logLevel, logType, spinnerAction }: LogInfo = {
      logLevel: LogLevel.Normal,
      logType: LogType.Info,
      spinnerAction: SpinnerAction.Add,
    },
  ): void {
    if (!logLevel) logLevel = LogLevel.Normal;
    if (!logType) logType = LogType.Info;
    if (!spinnerAction) spinnerAction = SpinnerAction.Add;
    this[reference] = { file, text, logLevel, logType, spinnerAction };
    this._log(reference);
  },

  update(
    reference: string,
    { spinnerAction, text }: UpdateParams,
    file?: string,
  ): void {
    if (this[reference]) {
      const args = pickby({ file, text, spinnerAction });
      this[reference] = { ...this[reference], ...args };
      this._log(reference);
    }
  },

  succeed(reference: string, text?: string): void {
    this[reference] = {
      ...this[reference],
      spinnerAction: SpinnerAction.Succeed,
      text,
    };
    this._log(reference);
  },

  fail(reference: string, text?: string): void {
    this[reference] = {
      ...this[reference],
      spinnerAction: SpinnerAction.Fail,
      text,
    };
    this._log(reference);
  },

  stopAll(spinnerAction: SpinnerAction = SpinnerAction.Fail): void {
    if (this.isSilent || this.isVerbose) return;
    spinners.stopAll(spinnerAction);
  },

  _log(reference: string): void {
    if (this.isSilent) return;
    const { file, text, spinnerAction, logLevel, logType } = this[reference];
    if (this.isVerbose) {
      const color = this._getColorFor(logType);
      const message = `[${new Date().toISOString()}@${file}] ${text}`;
      console.error(chalk.keyword(color)(message));
    } else if (logLevel === LogLevel.Normal) {
      !spinners.pick(reference)
        ? spinners.add(reference, { text, status: spinnerAction })
        : spinners.update(reference, { text, status: spinnerAction });
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
    console.error(chalk[color](msg));
  }

  public get opts(): LoggerOptions {
    return { ...this._opts, ...Logger._defaults };
  }
}
