'use strict';

import createProxy from '../scripts/create-proxy'
import runWithTruffle from '../utils/runWithTruffle'
import { parseArgs } from '../utils/input'

const signature = 'create <alias>'
const description = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with'

module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, {noHelp: true})
      .usage('<alias> --network <network> [options]')
      .description(description)
      .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
      .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
      .option('-f, --from <from>', 'specify transaction sender address')
      .option('-n, --network <network>', 'network to be used')
      .option('--force', 'force creation even if contracts have local modifications')
      .action(function (contractAlias, options) {
        let initMethod = options.init
        if(typeof initMethod === 'boolean') initMethod = 'initialize'

      let initArgs = options.args
      if(typeof initArgs === 'string') initArgs = parseArgs(initArgs)
      else if(typeof initArgs === 'boolean' || initMethod) initArgs = []

        const { from, network, force } = options
        const txParams = from ? { from } : {}
        runWithTruffle(async () => await createProxy({
          contractAlias, initMethod, initArgs, network, txParams, force
        }), network)
      })
  }
}
