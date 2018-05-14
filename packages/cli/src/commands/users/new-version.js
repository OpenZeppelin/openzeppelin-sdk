import sync from './sync'
import newVersion from '../../scripts/new-version'

module.exports = function(program) {
  program
    .command('new-version <version>')
    .usage('<version> [options]')
    .description("Bump a new <version> of your project with zeppelin_os.")
    .option('-s, --stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--sync <network>', 'Sync your project with the blockchain')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --sync')
    .action(async function (version, options) {
      const { stdlib: stdlibNameVersion, install: installDeps } = options
      await newVersion({ version, stdlibNameVersion, installDeps })
      if(options.sync) sync.action({ network: options.sync, from: options.from })
    })
}
