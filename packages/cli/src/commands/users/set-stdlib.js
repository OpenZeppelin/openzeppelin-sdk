import sync from './sync'
import setStdlib from '../../scripts/set-stdlib'

module.exports = function(program) {
  program
    .command('set-stdlib <stdlib>')
    .usage('<stdlib> [options]')
    .description("Set a standard library for your project.\n  Provide the npm package of the standard library under <stdlib>.")
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--sync <network>', 'Sync your project with the blockchain')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --sync')
    .action(async function (stdlibNameVersion, options) {
      const installDeps = options.install
      await setStdlib({ stdlibNameVersion, installDeps })
      if(options.sync) sync.action({ network: options.sync, from: options.from })
    })
}
