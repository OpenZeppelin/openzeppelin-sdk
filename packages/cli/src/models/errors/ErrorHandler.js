import { Logger } from 'zos-lib'

const log = new Logger('Error')
const GENERIC_ERROR_MESSAGE = 'There was an undefined error. Please execute the same command again in verbose mode if necessary.'

export default class ErrorHandler {
  constructor(error, { verbose }) {
    this.error = error
    this.verbose = verbose
  }

  call() {
    if (!this.verbose) {
      const errorMessage = this.error.message || GENERIC_ERROR_MESSAGE
      log.error(errorMessage)
    }
    else log.error(this.error.stack)
    if (this.error.cb) this.error.cb()

    process.exit(1)
  }
}
