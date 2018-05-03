const vouch = require('../commands/vouching/vouch')
const unvouch = require('../commands/vouching/unvouch')

module.exports = function registerVouchingCommands(program) {
  vouch(program)
  unvouch(program)
}
