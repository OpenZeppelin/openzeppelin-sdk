'use strict';

import remove from '../scripts/remove'
import push from './push'

const signature = 'remove [contracts...]'
const description = 'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.'
module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, { noHelp: true })
      .alias('rm')
      .usage('[contract1 ... contractN] [options]')
      .description(description)
      .option('--push <network>', 'push all changes to the specified network after removing')
      .option('-f, --from <from>', 'specify the transaction sender address for --push')
      .action(async function (contracts, options) {
        remove({ contracts })
        if (options.push) {
          push.action({ network: options.push, from: options.from })
        }
      })
  }
}
