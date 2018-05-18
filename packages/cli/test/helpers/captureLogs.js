import { Logger } from 'zos-lib';

export default class CaptureLogs {
  constructor() {
    this.infos = [];
    this.errors = [];
    this.origError = Logger.prototype.error;
    this.origInfo = Logger.prototype.info;
    Logger.prototype.error = (msg) => { this.errors.push(msg); }
    Logger.prototype.info = (msg) => { this.infos.push(msg); }
  }

  restore() {
    Logger.prototype.error = this.origError;
    Logger.prototype.info = this.origInfo;
  }
}