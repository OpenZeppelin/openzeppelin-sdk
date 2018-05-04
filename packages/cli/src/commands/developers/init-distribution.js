import initDistribution from '../../scripts/init-distribution'

module.exports = function(program) {
  program
    .command('init-distribution <name> <kernel>')
    .usage('<name> <kernel>')
    .description(`Initialize your distribution project for standard libraries.
      Provide a distribution <name> for your project.
      Provide the zeppelin_os <kernel> address where your releases are going to be published.`)
    .action(function (name, kernelAddress) {
      initDistribution({ name, kernelAddress })
    })
}
