import colors from 'colors'

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

  error(msg) {
    this.log(msg, 'red')
  }

  log(msg, color) {
    if (this.opts.silent) {
      return;
    }
    if (this.opts.verbose) {
      console.error(`[${this.prefix}] ${msg}`[color])
    } else {
      console.error(msg[color])
    }
  }

  get opts() {
    return Object.assign({}, this._opts, defaults)
  }
}