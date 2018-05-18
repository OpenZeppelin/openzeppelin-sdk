import push from './push'
import init from '../scripts/init'
import initLib from '../scripts/init-lib'

module.exports = function(program) {
  program
    .command('init <project> [version]')
    .usage('<project> [version] [options]')
    .description(`Initialize your project with zeppelin_os.
      Provide a <project> name.
      Provide a [version] number, otherwise 0.0.1 will be used by default.`)
    .option('--lib', 'Create a standard library instead of a regular application')
    .option('--force', 'Override existing project if there is an existing one')
    .option('--stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .option('--push <network>', 'Push your changes to the specified network')
    .option('-f, --from <from>', 'Set the transactions sender in case you run with --push')
    .action(async function (name, version, options) {
      if (options.lib) {
        if (options.stdlib) throw Error("Cannot set a stdlib in a library project")
        await initLib({ name, version })
      } else {
        const { force, stdlib: stdlibNameVersion, install: installDeps } = options
        await init({ name, version, stdlibNameVersion, installDeps, force })
      }
      
      if (options.push) {
        push.action({ network: options.push, from: options.from })
      }
    })
}
