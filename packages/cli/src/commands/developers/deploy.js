import deploy from '../../scripts/deploy'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('deploy <version>')
    .description(`Deploys the new stdlib release to the chosen network.
      Provide the <version> of the release to be deployed.`)
    .usage('<version> --network <network> [options]')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (version, options) {
      const { from, network } = options
      runWithTruffle(() => deploy({ version, network, from }), network)
    })
}
