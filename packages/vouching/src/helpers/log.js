import chalk from 'chalk'

const defaults = {
  silent: false
}

export default {

  silent(value) {
    defaults.silent = value
  },

  base(msg) {
    this.log(msg, 'white')
  },

  info(msg) {
    this.log(msg, 'green')
  },

  warn(msg) {
    this.log(msg, 'yellow')
  },

  error(msg) {
    this.log(msg, 'red')
  },

  log(msg, color) {
    if (defaults.silent) return
    console.error(chalk.keyword(color)(msg))
  }
}
