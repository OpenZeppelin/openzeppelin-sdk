import register from '../../scripts/register'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('register <release>')
    .usage('<release> --network <network> [options]')
    .description(`Register an already deployed stdlib release to zeppelin_os kernel.
      Provide the <release>  address to be registered.`)
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (releaseAddress, options) {
      const { network, from } = options
      runWithTruffle(async () => await register({ releaseAddress, network, from }), network)
    })
}
