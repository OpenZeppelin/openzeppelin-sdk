import colors from 'colors'

export default class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  info(msg) {
    console.log(`[${this.prefix}] ${msg}`.green)
  }

  error(msg) {
    console.error(`[${this.prefix}] ${msg}`.red)
  }
}
