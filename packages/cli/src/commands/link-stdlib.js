import push from './push'
import linkStdlib from '../scripts/link-stdlib'

module.exports = function(program) {
  program
    .command('link <stdlib>')
    .usage('<stdlib> [options]')
    .description("Links a standard library for your project.\n  Provide the npm package of the standard library under <stdlib>.")
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--push <network>', 'Push your changes to the specified network')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --push')
    .action(async function (stdlibNameVersion, options) {
      const installDeps = options.install
      await linkStdlib({ stdlibNameVersion, installDeps })
      if(options.push) push.action({ network: options.push, from: options.from })
    })
}
