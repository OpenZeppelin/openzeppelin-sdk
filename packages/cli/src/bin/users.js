const init = require('../commands/users/init')
const addImplementation = require('../commands/users/add-implementation')
const push = require('../commands/users/push')
const createProxy = require('../commands/users/create-proxy')
const bumpVersion = require('../commands/users/bump-version')
const upgradeProxy = require('../commands/users/upgrade-proxy')
const linkStdlib = require('../commands/users/link-stdlib')
const status = require('../commands/users/status')

module.exports = function registerUserCommands(program) {
  init(program)
  addImplementation(program)
  push(program)
  createProxy(program)
  bumpVersion(program)
  upgradeProxy(program)
  linkStdlib(program)
  status(program)
}
