import colors from 'colors'

export default class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  out(msg) {
    console.log(msg)
  }

  info(msg) {
    console.error(`[${this.prefix}] ${msg}`.green)
  }

  error(msg) {
    console.error(`[${this.prefix}] ${msg}`.red)
  }
}
