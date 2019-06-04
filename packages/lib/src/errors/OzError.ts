import { Loggy, LogStatus } from '../utils/Logger';

export default class OzError extends Error {
  public constructor(
    message: string,
    logType: LogStatus = LogStatus.Fail,
    error?: Error,
  ) {
    super(message);
    if (error) this.stack = error.stack;
    this.name = 'OzError';
    Loggy.stopAll(logType);
  }
}
