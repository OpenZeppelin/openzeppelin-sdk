const program = require('commander')
const { version } = require('../../package.json')
const registerErrorHandler = require('./errors')

const init = require('../commands/users/init')
const addImplementation = require('../commands/users/add-implementation')
const push = require('../commands/users/push')
const createProxy = require('../commands/users/create-proxy')
const bumpVersion = require('../commands/users/bump-version')
const upgradeProxy = require('../commands/users/upgrade-proxy')
const linkStdlib = require('../commands/users/link-stdlib')
const status = require('../commands/users/status')

program
  .name('zos')
  .usage('<command> [options]')
  .version(version, '--version')
  .option('-v, --verbose', 'Switch verbose mode on. Output errors stacktrace.')

init(program)
addImplementation(program)
push(program)
createProxy(program)
bumpVersion(program)
upgradeProxy(program)
linkStdlib(program)
status(program)

registerErrorHandler(program)

module.exports = program;
