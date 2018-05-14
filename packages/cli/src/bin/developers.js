const initDistribution = require('../commands/developers/init-distribution')
const deploy = require('../commands/developers/deploy')

module.exports = function registerDevelopersCommands(program) {
  initDistribution(program)
  deploy(program)
}
