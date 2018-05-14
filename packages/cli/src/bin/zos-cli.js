#! /usr/bin/env node

const program = require('commander')
const { version } = require('../../package.json')
const registerUserCommands = require('./users')
const registerDeveloperCommands = require('./developers')
const registerErrorHandler = require('./errors')

program
  .usage('<command> [options]')
  .version(version, '--version')
  .option('-v, --verbose', 'Switch verbose mode on. Output errors stacktrace.')

registerUserCommands(program)
registerDeveloperCommands(program)
registerErrorHandler(program)

program.parse(process.argv)
