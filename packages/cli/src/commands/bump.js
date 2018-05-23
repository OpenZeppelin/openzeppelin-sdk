'use strict';

import push from './push'
import bump from '../scripts/bump'

const signature = 'bump <version>'
const description = 'bump your project to a new <version>'
module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, {noHelp: true})
      .usage('<version> [options]')
      .description(description)
      .option('--link <stdlib>', 'link to new standard library version')
      .option('--no-install', 'skip installing stdlib dependencies locally')
      .option('--push <network>', 'push changes to the specified network after bumping version')
      .option('-f, --from <from>', 'specify transaction sender address for --push')
      .action(async function (version, options) {
        const { link: stdlibNameVersion, install: installDeps } = options
        await bump({ version, stdlibNameVersion, installDeps })
        if(options.push) push.action({ network: options.push, from: options.from })
      })
  }
}
