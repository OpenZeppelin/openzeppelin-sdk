import { Loggy } from '@openzeppelin/upgrades';

export default class CaptureLogs {
  constructor() {
    this.clear();
    // TODO: Refactor. Replacing the Loggy#add fn should be enough
    this.originalSpin = Loggy.spin;
    this.originalNoSpin = Loggy.noSpin;
    this.originalNoSpinWarn = Loggy.noSpin.warn;
    this.originalNoSpinError = Loggy.noSpin.error;
    this.originalSucceed = Loggy.succeed;
    this.originalFail = Loggy.fail;
    this.onVerbose = Loggy.onVerbose;

    Loggy.succeed = (ref, msg) => this.infos.push(msg);
    Loggy.fail = (ref, msg) => this.infos.push(msg);
    Loggy.spin = (file, fn, ref, msg) => this.infos.push(msg);
    Loggy.noSpin = (file, fn, ref, msg) => this.infos.push(msg);
    Loggy.noSpin.warn = (file, fn, ref, msg) => this.warns.push(msg);
    Loggy.noSpin.error = (file, fn, ref, msg) => this.errors.push(msg);
    Loggy.onVerbose = (file, fn, ref, msg) => this.infos.push(msg);
  }

  get text() {
    return this.toString();
  }

  get logs() {
    return this.infos.concat(this.warns, this.errors);
  }

  clear() {
    this.infos = [];
    this.warns = [];
    this.errors = [];
  }

  restore() {
    Loggy.spin = this.originalSpin;
    Loggy.noSpin = this.originalNoSpin;
    Loggy.noSpin.warn = this.originalNoSpinWarn;
    Loggy.noSpin.error = this.originalNoSpinError;
    Loggy.succeed = this.originalSucceed;
    Loggy.fail = this.originalFail;
    Loggy.onVerbose = this.onVerbose;
  }

  match(re) {
    return this.logs.some(log => log.match(re));
  }

  toString() {
    return this.logs.join('\n');
  }
}
