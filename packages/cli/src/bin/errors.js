import ErrorHandler from '../models/ErrorHandler'

module.exports = function registerErrorHandler(program) {
  process.on('unhandledRejection', reason => { throw Error(reason); })
  process.on('uncaughtException', error => new ErrorHandler(error, program).call())
}
