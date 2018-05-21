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

  clear() {
    this.infos = [];
    this.errors = [];
  }

  restore() {
    Logger.prototype.error = this.origError;
    Logger.prototype.info = this.origInfo;
  }

  match(re) {
    return _(_.concat(this.infos, this.errors)).map((msg) => msg.match(re)).compact().head();
  }

  get text() {
    return this.toString();
  }

  toString() {
    return _.concat(this.infos, this.errors).join("\n");
  }
}