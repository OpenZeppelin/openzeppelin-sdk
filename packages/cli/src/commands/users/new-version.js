import newVersion from '../../scripts/new-version'

module.exports = function(program) {
  program
    .command('new-version <version>')
    .description("Bump a new <version> of your project with zeppelin_os.")
    .option('-s, --stdlib <stdlib>', 'Standard library to use')
    .option('--no-install', 'Skip installing stdlib npm dependencies')
    .action(async function (version, options) {
      const { stdlib: stdlibNameVersion, install: installDeps } = options
      await newVersion({ version, stdlibNameVersion, installDeps })
    })
}
