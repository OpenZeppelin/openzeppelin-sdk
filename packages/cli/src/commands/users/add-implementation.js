import sync from './sync'
import addImplementation from '../../scripts/add-implementation'
import addAllImplementations from '../../scripts/add-all-implementations'

module.exports = function(program) {
  program
    .command('add-implementation [contractNames...]')
    .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
    .description(`Register contract implementations.
      Provide a list of [contractNames...] to be registered.
      Provide an alias to register your contract using the notation <contractName:contractAlias>.
      If no alias is provided, <contractName> will be used by default.`)
    .option('--all', 'Skip contract names option and set --all to add all the contracts of your build directory.')
    .option('--sync <network>', 'Sync your project with the blockchain')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --sync')
    .action(function (contractNames, options) {
      if(options.all) addAllImplementations({})
      else {
        const contractsData = contractNames.map(rawData => {
          let [ name, alias ] = rawData.split(':')
          return { name, alias: (alias || name) }
        })
        addImplementation({ contractsData })
      }
      if(options.sync) sync.action({ network: options.sync, from: options.from })
    })
}
