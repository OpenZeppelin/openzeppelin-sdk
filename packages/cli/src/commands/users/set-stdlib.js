import setStdlib from '../../scripts/set-stdlib'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('set-stdlib <stdlib>')
    .description("Set a standard library for your project.\n  Provide the npm package of the standard library under <stdlib>.")
    .usage('<stdlib> [options]')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .action(function (stdlibNameVersion, options) {
      const installDeps = options.install
      runWithTruffle(async () => await setStdlib({ stdlibNameVersion, installDeps }))
    })
}
