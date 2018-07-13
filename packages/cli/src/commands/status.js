'use strict';

import status from '../scripts/status'
import pull from '../scripts/pull'
import compare from '../scripts/compare'
import runWithTruffle from '../utils/runWithTruffle'

const name = 'status'
const signature = name
const description = 'print information about the local status of your app in a specific network'

const register = program => program
  .command(signature, { noHelp: true })
  .description(description)
  .usage('--network <network>')
  .option('-n, --network <network>', 'network to be used')
  .option('--fetch', 'retrieve app information directly from the network instead of from the local network file')
  .option('--fix', 'update local network file with information retrieved from the network')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .option('-f, --from <from>', 'specify transaction sender address')
  .action(action)

async function action(options) {
  await runWithTruffle(async (opts) => {
    if (options.fix) {
      await pull(opts)
    } else if (options.fetch) {
      await compare(opts)
    } else {
      await status(opts)
    }
  }, options)
}

export default { name, signature, description, register, action }
