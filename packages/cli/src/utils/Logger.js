import colors from 'colors'

class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  success(msg) {
    console.log(`[${this.prefix}] ${msg}`.green)
  }

  error(msg) {
    console.error(`[${this.prefix}] ${msg}`.red)
  }
}


module.exports = Logger