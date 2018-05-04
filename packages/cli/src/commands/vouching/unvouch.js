import unvouch from '../../scripts/unvouch'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('unvouch <release> <amount>')
    .usage('<release> <amount> --network <network> [options]')
    .description(`Unvouches a requested amount of ZEP tokens to a given release.
      Provide the <release> address to unvouch for.
      Provide the raw-amount of ZEP tokens to be unvouched for the given <release>.`)
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (releaseAddress, rawAmount, options) {
      const { network, from } = options
      runWithTruffle(async () => await unvouch({ releaseAddress, rawAmount, network, from }), network)
    })
}
