import upgradeProxy from '../scripts/upgrade-proxy'
import runWithTruffle from '../utils/runWithTruffle'

module.exports = function(program) {
  program
    .command('upgrade [alias] [address]')
    .usage('[alias] [address] --network <network> [options]')
    .description(`Upgrade a proxied contract to a new implementation.
      Provide the [alias] name you used to register your contract. Provide [address] to choose which proxy to upgrade, otherwise all will be upgraded.`)
    .option('--init [function]', "Tell whether your new implementation has to be initialized or not. You can provide name of the initialization function. If none is given, 'initialize' will be considered by default")
    .option('--args <arg1, arg2, ...>', 'Provide initialization arguments for your contract if required')
    .option('--all', 'Skip the alias option and set --all to upgrade all proxies in the application')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .option('--force', 'Force upgrading the proxy even if contracts have local modifications')
    .action(function (contractAlias, proxyAddress, options) {
      let initMethod = options.init
      if(typeof initMethod === 'boolean') initMethod = 'initialize'

      let initArgs = options.args
      if(typeof initArgs === 'string') initArgs = initArgs.split(",")
      else if(typeof initArgs === 'boolean' || initMethod) initArgs = []

      const { from, network, all, force } = options
      const txParams = from ? { from } : {}
      runWithTruffle(async () => await upgradeProxy({ contractAlias, proxyAddress, initMethod, initArgs, all, network, txParams, force }), network)
    })
}
