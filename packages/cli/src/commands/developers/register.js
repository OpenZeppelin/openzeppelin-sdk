import register from '../../scripts/register'
import runWithTruffle from '../../utils/runWithTruffle'

export default function(program) {
  program
    .command('register <release>')
    .description(`Register an already deployed stdlib release to zeppelin_os kernel.
      Provide the <release>  address to be registered.`)
    .usage('<release> --network <network>')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (releaseAddress, options) {
      const { network, from } = options
      runWithTruffle(() => register({ releaseAddress, network, from }), network)
    })
}
