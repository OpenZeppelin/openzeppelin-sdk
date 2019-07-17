import path from 'path';
import pickBy from 'lodash.pickby';
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

// TS-TODO: add object interface
export const Loggy: { [key: string]: any } = {
  logs: {},
  isSilent: true,
  isVerbose: false,
  isTesting: false,

  silent(value: boolean): void {
    this.isSilent = value;
  },

  verbose(value: boolean): void {
    this.isVerbose = value;
  },

  testing(value: boolean): void {
    this.isTesting = value;
  },

  add(
    file: string,
    fnName: string,
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
    this.logs[reference] = {
      file,
      fnName,
      text,
      logLevel,
      logType,
      spinnerAction,
    };
    this._log(reference);
  },

  update(reference: string, { spinnerAction, text }: UpdateParams, file?: string): void {
    if (this.logs[reference]) {
      const args = pickBy({ file, text, spinnerAction });
      this.logs[reference] = { ...this.logs[reference], ...args };
      this._log(reference);
    }
  },

  succeed(reference: string, text?: string): void {
    if (!text && this.logs[reference]) text = this.logs[reference].text;
    this.logs[reference] = {
      ...this.logs[reference],
      spinnerAction: SpinnerAction.Succeed,
      text,
    };
    this._log(reference);
  },

  fail(reference: string, text?: string): void {
    if (!text && this.logs[reference]) text = this.logs[reference].text;
    this.logs[reference] = {
      ...this.logs[reference],
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
    try {
      if (this.isSilent) return;
      const { file, fnName, text, spinnerAction, logLevel, logType } = this.logs[reference];
      const color = this._getColorFor(logType);
      if (this.isVerbose || this.isTesting) {
        const location = `${path.basename(file)}#${fnName}`;
        const message = `[${new Date().toISOString()}@${location}] <${this._actionToText(spinnerAction)}> ${text}`;
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
  },

  _actionToText(action: SpinnerAction): string {
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
  },

  _getColorFor(logType: LogType): string {
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
  },
};

const spinnerActions = {
  spin: SpinnerAction.Add,
  noSpin: SpinnerAction.NonSpinnable,
};

const logTypes = {
  info: LogType.Info,
  warn: LogType.Warn,
  error: LogType.Err,
};

Object.keys(spinnerActions).forEach(spinnerAction => {
  Loggy.onVerbose = (file: string, fnName: string, reference: string, text: string): void =>
    Loggy.add(file, fnName, reference, text, {
      logLevel: LogLevel.Verbose,
    });

  Loggy[spinnerAction] = (file: string, fnName: string, reference: string, text: string): void =>
    Loggy.add(file, fnName, reference, text, {
      spinnerAction: spinnerActions[spinnerAction],
    });

  Loggy[spinnerAction].onVerbose = (file: string, fnName: string, reference: string, text: string): void =>
    Loggy.add(file, fnName, reference, text, {
      spinnerAction: spinnerActions[spinnerAction],
      logLevel: LogLevel.Verbose,
    });

  Object.keys(logTypes).forEach(logType => {
    Loggy[spinnerAction][logType] = (file: string, fnName: string, reference: string, text: string): void =>
      Loggy.add(file, fnName, reference, text, {
        spinnerAction: spinnerActions[spinnerAction],
        logType: logTypes[logType],
      });

    Loggy[spinnerAction][logType].onVerbose = (file: string, fnName: string, reference: string, text: string): void =>
      Loggy.add(file, fnName, reference, text, {
        spinnerAction: spinnerActions[spinnerAction],
        logType: logTypes[logType],
        logLevel: LogLevel.Verbose,
      });
  });
});
