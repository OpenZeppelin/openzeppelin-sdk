import upgradeProxy from '../../scripts/upgrade-proxy'
import runWithTruffle from '../../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('upgrade-proxy <alias> <address>')
    .description("Upgrade a proxied contract to a new implementation.\n  Provide the <alias> name you used to register your contract.")
    .usage('<alias> <address> --network <network> [options]')
    .option('-i, --init [function]', "Tell whether your new implementation has to be initialized or not. You can provide name of the initialization function. If none is given, 'initialize' will be considered by default")
    .option('-a, --args <arg1, arg2, ...>', 'Provide initialization arguments for your contract if required')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .action(function (contractAlias, proxyAddress, options) {
      let initMethod = program.init
      if(typeof initMethod === 'boolean') initMethod = 'initialize'

      let initArgs = program.params
      if(typeof initArgs === 'string') initArgs = initArgs.split(",")
      else if(typeof initArgs === 'boolean' || initMethod) initArgs = []

      const { from, network } = options
      runWithTruffle(() => upgradeProxy({ contractAlias, proxyAddress, network, from, initMethod, initArgs }), network)
    })
}
