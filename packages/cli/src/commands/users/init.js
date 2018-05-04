import init from '../../scripts/init'

module.exports = function(program) {
  program
    .command('init <project> [version]')
    .description(`Initialize your project with zeppelin_os.
      Provide a <project> name.
      Provide a [version] number, otherwise 0.0.1 will be used by default.`)
    .option('-s, --stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .action(async function (name, version, options) {
      const { stdlib: stdlibNameVersion, install: installDeps } = options
      await init({ name, version, stdlibNameVersion, installDeps })
    })
}
