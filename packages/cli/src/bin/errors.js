import ErrorHandler from '../models/ErrorHandler'

module.exports = function registerErrorHandler(program) {
  process.on('unhandledRejection', reason => new ErrorHandler(reason, program).call())
  process.on('uncaughtException', error => new ErrorHandler(error, program).call())

  program.on('command:*', function () {
    console.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`)
    process.exit(1)
  })
}
