import path from 'path';
import { pickBy } from 'lodash';
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

const defaultLogInfo = {
  logLevel: LogLevel.Normal,
  logType: LogType.Info,
  spinnerAction: SpinnerAction.Add,
};

const logTypes = {
  info: LogType.Info,
  warn: LogType.Warn,
  error: LogType.Err,
};

interface Logs {
  [reference: string]: {
    file: string;
    fnName: string;
    text: string;
    logLevel: LogLevel;
    logType: LogType;
    spinnerAction: SpinnerAction;
  };
}

export class Loggy {
  private static logs: Logs = {};
  private static isSilent = true;
  private static isVerbose = false;
  private static isTesting = false;

  public static silent(value: boolean): void {
    this.isSilent = value;
  }

  public static verbose(value: boolean): void {
    this.isVerbose = value;
  }

  public static testing(value: boolean): void {
    this.isTesting = value;
  }

  public static add(
    file: string,
    fnName: string,
    reference: string,
    text: string,
    { logLevel, logType, spinnerAction }: LogInfo = defaultLogInfo,
  ): void {
    if (!logLevel) logLevel = LogLevel.Normal;
    if (!logType) logType = LogType.Info;
    if (!spinnerAction) spinnerAction = SpinnerAction.Add;
    this.logs[reference] = {
      file,
      fnName,
      text,
      logLevel,
      logType,
      spinnerAction,
    };
    this.log(reference);
  }

  public static update(reference: string, { spinnerAction, text }: UpdateParams, file?: string): void {
    if (this.logs[reference]) {
      const args = pickBy({ file, text, spinnerAction });
      this.logs[reference] = { ...this.logs[reference], ...args };
      this.log(reference);
    }
  }

  public static succeed(reference: string, text?: string): void {
    if (!text && this.logs[reference]) text = this.logs[reference].text;
    this.logs[reference] = {
      ...this.logs[reference],
      spinnerAction: SpinnerAction.Succeed,
      text,
    };
    this.log(reference);
  }

  public static fail(reference: string, text?: string): void {
    if (!text && this.logs[reference]) text = this.logs[reference].text;
    this.logs[reference] = {
      ...this.logs[reference],
      spinnerAction: SpinnerAction.Fail,
      text,
    };
    this.log(reference);
  }

  public static stopAll(spinnerAction: SpinnerAction = SpinnerAction.Fail): void {
    if (this.isSilent || this.isVerbose) return;
    spinners.stopAll(spinnerAction);
  }

  public static onVerbose(file: string, fnName: string, reference: string, text: string): void {
    this.add(file, fnName, reference, text, {
      logLevel: LogLevel.Verbose,
    });
  }

  private static log(reference: string): void {
    try {
      if (this.isSilent) return;
      const { file, fnName, text, spinnerAction, logLevel, logType } = this.logs[reference];
      const color = this.getColorFor(logType);
      if (this.isVerbose || this.isTesting) {
        const location = `${path.basename(file)}#${fnName}`;
        const message = `[${new Date().toISOString()}@${location}] <${this.actionToText(spinnerAction)}> ${text}`;
        const coloredMessage = color ? chalk.keyword(color)(message) : message;
        if (!this.isTesting) console.error(coloredMessage);
      } else if (logLevel === LogLevel.Normal) {
        const options = color ? { text, status: spinnerAction, color } : { text, status: spinnerAction };
        !spinners.pick(reference) ? spinners.add(reference, options) : spinners.update(reference, options);
      }
    } catch (err) {
      if (this.isTesting) throw new Error(`Error logging ${reference}: ${err}`);
      else console.error(`Error logging ${reference}: ${err}`);
    }
  }

  private static actionToText(action: SpinnerAction): string {
    switch (action) {
      case SpinnerAction.Add:
        return 'started';
      case SpinnerAction.NonSpinnable:
        return 'started';
      case SpinnerAction.Succeed:
        return 'succeeded';
      case SpinnerAction.Fail:
        return 'failed';
      case SpinnerAction.Update:
        return 'updated';
      default:
        return '';
    }
  }

  private static getColorFor(logType: LogType): string {
    switch (logType) {
      case LogType.Err:
        return 'red';
      case LogType.Warn:
        return 'yellow';
      case LogType.Info:
        return null;
      default:
        return null;
    }
  }

  public static spin = logSpinner(SpinnerAction.Add);
  public static noSpin = logSpinner(SpinnerAction.NonSpinnable);
}

type LogFunction = (file: string, fnName: string, reference: string, text: string) => void;

type LogTypeFunctions = {
  [t in keyof typeof logTypes]: LogFunction & { onVerbose: LogFunction };
};

type LogSpinFunction = LogFunction & LogTypeFunctions & { onVerbose: LogFunction };

function logSpinner(action: SpinnerAction): LogSpinFunction {
  const log: Partial<LogSpinFunction> = (file, fnName, reference, text): void =>
    Loggy.add(file, fnName, reference, text, {
      spinnerAction: action,
    });

  log.onVerbose = (file, fnName, reference, text): void =>
    Loggy.add(file, fnName, reference, text, {
      spinnerAction: action,
      logLevel: LogLevel.Verbose,
    });

  for (const logType in logTypes) {
    log[logType] = (file, fnName, reference, text): void =>
      Loggy.add(file, fnName, reference, text, {
        spinnerAction: action,
        logType: logTypes[logType],
      });

    log[logType].onVerbose = (file, fnName, reference, text): void =>
      Loggy.add(file, fnName, reference, text, {
        spinnerAction: action,
        logType: logTypes[logType],
        logLevel: LogLevel.Verbose,
      });
  }

  return log as LogSpinFunction;
}
