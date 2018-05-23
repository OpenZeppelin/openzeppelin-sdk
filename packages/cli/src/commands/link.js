'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const signature = 'link <stdlib>'
const description = 'links project with a standard library located in the <stdlib> npm package'
module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, {noHelp: true})
      .usage('<stdlib> [options]')
      .description(description)
      .option('--no-install', 'skip installing stdlib dependencies locally')
      .option('--push <network>', 'push changes to the specified network')
      .option('-f, --from <from>', 'specify transaction sender address for --push')
      .action(async function (stdlibNameVersion, options) {
        const installDeps = options.install
        await linkStdlib({ stdlibNameVersion, installDeps })
        if(options.push) push.action({ network: options.push, from: options.from })
      })
  }
}
