#! /usr/bin/env node

const program = require('commander')
const registerUserCommands = require('./users')
const registerVouchingCommands = require('./vouching')
const registerDeveloperCommands = require('./developers')

program
  .usage('<command> [options]')
  .version(require('../../package.json').version, '-v, --version')

registerUserCommands(program)
registerVouchingCommands(program)
registerDeveloperCommands(program)
program.parse(process.argv);
