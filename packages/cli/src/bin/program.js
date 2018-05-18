'use strict';

const program = require('commander')
const { version } = require('../../package.json')
const registerErrorHandler = require('./errors')
const Logger = require('zos-lib').Logger;
const chalk = require('chalk')

const init = require('../commands/init')
const add = require('../commands/add-implementation')
const push = require('../commands/push')
const create = require('../commands/create-proxy')
const bump = require('../commands/bump-version')
const upgrade = require('../commands/upgrade-proxy')
const link = require('../commands/link-stdlib')
const status = require('../commands/status')
const freeze = require('../commands/freeze')

program
  .name('zos')
  .usage('<command> [options]')
  .description('where <command> is one of:\n' +
          '\t add, bump, create, init, link, push, status, upgrade.')
  .version(version, '--version')
  .option('-v, --verbose', 'verbose mode on: output errors stacktrace and detailed log.')
  .option('-s, --silent', 'silent mode: no output sent to stderr.')
  .on('option:verbose', () => { Logger.verbose(true); } )
  .on('option:silent', () => { Logger.silent(true); } )

const commands = [init, add, push, create, bump, upgrade, link, status, freeze]

commands.forEach((c) => c.register(program));

const maxSig = Math.max(...commands.map(c => c.signature.length))
program.on('--help', function(){
  commands.forEach((c) => {
    console.log(`    ${chalk.bold(c.signature.padEnd(maxSig))}\t${c.description}\n`)
  });
  console.log('');
});

registerErrorHandler(program)

module.exports = program;
