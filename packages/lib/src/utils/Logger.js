import chalk from 'chalk'

const defaults = {
  verbose: false,
  silent: true
};

export default class Logger {
  static silent(value) {
    defaults.silent = value;
  }

  static verbose(value) {
    defaults.verbose = value;
  }

  constructor(prefix, opts) {
    this.prefix = prefix;
    this._opts = opts;
  }

  info(msg) {
    this.log(msg, 'green')
  }

  warn(msg) {
    this.log(msg, 'yellow')
  }

  error(msg) {
    this.log(msg, 'red')
  }

  log(msg, color) {
    if (this.opts.silent) {
      return;
    }
    if (this.opts.verbose) msg = `[${this.prefix}] ${msg}`
    console.error(chalk.keyword(color)(msg))
  }

  get opts() {
    return Object.assign({}, this._opts, defaults)
  }
}
