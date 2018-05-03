const initDistribution = require('../commands/developers/init-distribution')
const deploy = require('../commands/developers/deploy')
const register = require('../commands/developers/register')

module.exports = function registerDevelopersCommands(program) {
  initDistribution(program)
  deploy(program)
  register(program)
}
