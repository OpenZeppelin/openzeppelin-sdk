import createProxy from '../scripts/create-proxy'
import runWithTruffle from '../utils/runWithTruffle'
import { parseArgs } from '../utils/input'

module.exports = function(program) {
  program
    .command('create <alias>')
    .usage('<alias> --network <network> [options]')
    .description(`Creates a new proxy for the specified implementation.
      Provide the <alias> name you used to register your contract.`)
    .option('--init [function]', "Tell whether your contract has to be initialized or not. You can provide name of the initialization function. If none is given, 'initialize' will be considered by default")
    .option('--args <arg1, arg2, ...>', 'Provide initialization arguments for your contract if required')
    .option('-f, --from <from>', 'Set the transactions sender')
    .option('-n, --network <network>', 'Provide a network to be used')
    .option('--force', 'Force creation of the proxy even if contracts have local modifications')
    .action(function (contractAlias, options) {
      let initMethod = options.init
      if(typeof initMethod === 'boolean') initMethod = 'initialize'

      let initArgs = options.args
      if(typeof initArgs === 'string') initArgs = parseArgs(initArgs)
      else if(typeof initArgs === 'boolean' || initMethod) initArgs = []

      const { from, network, force } = options
      const txParams = from ? { from } : {}
      runWithTruffle(async () => await createProxy({ contractAlias, initMethod, initArgs, network, txParams, force }), network)
    })
}
