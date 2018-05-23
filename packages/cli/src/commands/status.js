'use strict';

import status from '../scripts/status'
import runWithTruffle from '../utils/runWithTruffle'

const signature = 'status'
const description = 'print information about the deployment of your app in a specific network'

module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, {noHelp: true})
      .description(description)
      .usage('--network <network>')
      .option('-n, --network <network>', 'network to be used')
      .option('-f, --from <from>', 'specify transaction sender address')
      .action(function (options) {
        const { from, network } = options
        const txParams = from ? { from } : {}
        runWithTruffle(async () => await status({ txParams, network }), network)
      })
  }
}
