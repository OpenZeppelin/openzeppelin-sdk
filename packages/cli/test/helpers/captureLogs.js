import { Logger } from 'zos-lib';

export default class CaptureLogs {
  constructor() {
    this.clear()
    this.originalInfo = Logger.prototype.info
    this.originalError = Logger.prototype.error
    Logger.prototype.info = msg => this.infos.push(msg)
    Logger.prototype.error = msg => this.errors.push(msg)

    // TODO: Replace with new Logger warn function once released
    this.originalLog = Logger.prototype.log
    Logger.prototype.log = (msg, color) => {
      if(color === 'yellow') this.warns.push(msg)
    }
  }

  get text() {
    return this.toString();
  }

  get logs() {
    return this.infos.concat(this.warns, this.errors)
  }

  clear() {
    this.infos = []
    this.warns = []
    this.errors = []
  }

  restore() {
    Logger.prototype.log = this.originalLog
    Logger.prototype.info = this.originalInfo
    Logger.prototype.error = this.originalError
  }

  match(re) {
    return this.logs.some(log => log.match(re))
  }

  toString() {
    return this.logs.join('\n')
  }
}
