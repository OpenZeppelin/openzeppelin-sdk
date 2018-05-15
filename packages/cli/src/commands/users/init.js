import sync from './sync'
import init from '../../scripts/init'

module.exports = function(program) {
  program
    .command('init <project> [version]')
    .usage('<project> [version] [options]')
    .description(`Initialize your project with zeppelin_os.
      Provide a <project> name.
      Provide a [version] number, otherwise 0.0.1 will be used by default.`)
    .option('--stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--push <network>', 'Push your changes to the specified network')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --push')
    .action(async function (name, version, options) {
      const { stdlib: stdlibNameVersion, install: installDeps } = options
      await init({ name, version, stdlibNameVersion, installDeps })
      if(options.push) sync.action({ network: options.push, from: options.from })
    })
}
