import sync from '../../scripts/sync'
import runWithTruffle from '../../utils/runWithTruffle'

function registerSync(program) {
  program
    .command('push')
    .description('Pushes your project to the specified network')
    .usage('--network <network> [options]')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .option('--skip-compile', 'Skips contract compilation')
    .option('--deploy-stdlib', 'Deploys a copy of the stdlib (if any) instead of using the one already published to the network by its author (useful in local testrpc networks)')
    .option('--reupload', 'Reuploads all contracts, regardless of not having been modified')
    .action(action)
}

function action(options) {
  const { from, network, skipCompile, deployStdlib, reupload } = options
  const txParams = from ? { from } : {}
  runWithTruffle(async () => await sync({ network, deployStdlib, reupload, txParams }), network, ! skipCompile)
}

module.exports = registerSync
module.exports.action = action
