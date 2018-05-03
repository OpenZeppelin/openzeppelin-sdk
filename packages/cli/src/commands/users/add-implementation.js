const addImplementation = require('../../scripts/add-implementation')

module.exports = function(program) {
  program
    .command('add-implementation <contractName> [alias]')
    .usage('<contractName> [alias]')
    .description(`Register a contract implementation.
      Provide the name of the contract under <contractName>.
      Provide an [alias] to register your contract, otherwise <contractName> will be used by default.`)
    .action(function (contractName, contractAlias) {
      addImplementation({ contractName, contractAlias })
    })
}
