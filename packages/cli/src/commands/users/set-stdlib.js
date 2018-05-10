import setStdlib from '../../scripts/set-stdlib'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('set-stdlib <stdlib>')
    .usage('<stdlib> [options]')
    .description("Set a standard library for your project.\n  Provide the npm package of the standard library under <stdlib>.")
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .action(async function (stdlibNameVersion, options) {
      const installDeps = options.install
      await setStdlib({ stdlibNameVersion, installDeps })
    })
}
