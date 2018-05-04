import sync from '../../scripts/sync'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('sync')
    .description("Sync your project with the blockchain")
    .usage('--network <network> [options]')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (options) {
      const { from, network } = options
      runWithTruffle(() => sync({ network, from }), network)
    })
}
