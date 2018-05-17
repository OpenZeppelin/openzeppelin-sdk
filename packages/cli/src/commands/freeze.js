import freeze from '../scripts/freeze'
import runWithTruffle from '../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('freeze')
    .usage('--network <network> [options]')
    .description('Freeze current release version of your stdlib project.')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (options) {
      const { from, network } = options
      const txParams = from ? { from } : {}
      runWithTruffle(async () => await freeze({ network, txParams }), network)
    })
}
