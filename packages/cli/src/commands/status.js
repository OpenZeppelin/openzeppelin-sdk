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
      .action(function (options) {
        const { network } = options
        runWithTruffle(async () => await status({ network }), network)
      })
  }
}
