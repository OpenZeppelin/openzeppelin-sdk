import push from './push'
import bumpVersion from '../../scripts/bump-version'

module.exports = function(program) {
  program
    .command('bump <version>')
    .usage('<version> [options]')
    .description("Bump a new <version> of your project with zeppelin_os.")
    .option('--stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--push <network>', 'Push your changes to the specified network')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --push')
    .action(async function (version, options) {
      const { stdlib: stdlibNameVersion, install: installDeps } = options
      await bumpVersion({ version, stdlibNameVersion, installDeps })
      if(options.push) push.action({ network: options.push, from: options.from })
    })
}
