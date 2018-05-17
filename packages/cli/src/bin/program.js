const program = require('commander')
const { version } = require('../../package.json')
const registerErrorHandler = require('./errors')
const Logger = require('zos-lib').Logger;

const init = require('../commands/init')
const addImplementation = require('../commands/add-implementation')
const push = require('../commands/push')
const createProxy = require('../commands/create-proxy')
const bumpVersion = require('../commands/bump-version')
const upgradeProxy = require('../commands/upgrade-proxy')
const linkStdlib = require('../commands/link-stdlib')
const freeze = require('../commands/freeze')
const status = require('../commands/status')

program
  .name('zos')
  .usage('<command> [options]')
  .version(version, '--version')
  .option('-v, --verbose', 'Verbose mode. Output errors stacktrace and detailed log.')
  .option('-s, --silent', 'Silent mode. Do not output anything to stderr.')
  .on('option:verbose', () => { Logger.verbose(true); } )
  .on('option:silent', () => { Logger.silent(true); } )

init(program)
addImplementation(program)
push(program)
createProxy(program)
bumpVersion(program)
upgradeProxy(program)
linkStdlib(program)
freeze(program)
status(program)

registerErrorHandler(program)

module.exports = program;
