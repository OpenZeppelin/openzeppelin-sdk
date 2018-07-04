'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const name = 'link'
const signature = `${name} <stdlib>`
const description = 'links project with a standard library located in the <stdlib> npm package'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<stdlib> [options]')
  .description(description)
  .option('--no-install', 'skip installing stdlib dependencies locally')
  .option('--push <network>', 'push changes to the specified network')
  .option('-f, --from <from>', 'specify transaction sender address for --push')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .action(action)

async function action(stdlibNameVersion, options) {
  const installLib = options.install
  await linkStdlib({ stdlibNameVersion, installLib })
  if(options.push) {
    await push.action({ network: options.push, from: options.from, timeout: options.timeout })
  }
}

export default { name, signature, description, register, action }
