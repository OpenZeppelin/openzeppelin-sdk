import { Logger } from 'zos-lib';

export default class CaptureLogs {
  constructor() {
    this.clear()
    this.originalInfo = Logger.prototype.info
    this.originalWarn = Logger.prototype.warn
    this.originalError = Logger.prototype.error
    Logger.prototype.info = msg => this.infos.push(msg)
    Logger.prototype.warn = msg => this.warns.push(msg)
    Logger.prototype.error = msg => this.errors.push(msg)
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
    Logger.prototype.info = this.originalInfo
    Logger.prototype.warn = this.originalWarn
    Logger.prototype.error = this.originalError
  }

  match(re) {
    return this.logs.some(log => log.match(re))
  }

  toString() {
    return this.logs.join('\n')
  }
}
