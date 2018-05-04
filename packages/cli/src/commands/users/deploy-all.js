import deployAll from '../../scripts/deploy-all'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('deploy-all')
    .usage('--network <network> [options]')
    .description("Deploy your entire application to the target network, along with the standard library you are using and all its contracts.")
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (options) {
      const { from, network } = options
      runWithTruffle(async () => await deployAll({ network, from }), network)
    })
}
