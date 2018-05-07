const init = require('../commands/users/init')
const addImplementation = require('../commands/users/add-implementation')
const sync = require('../commands/users/sync')
const createProxy = require('../commands/users/create-proxy')
const newVersion = require('../commands/users/new-version')
const upgradeProxy = require('../commands/users/upgrade-proxy')
const setStdlib = require('../commands/users/set-stdlib')

module.exports = function registerUserCommands(program) {
  init(program)
  addImplementation(program)
  sync(program)
  createProxy(program)
  newVersion(program)
  upgradeProxy(program)
  setStdlib(program)
}
