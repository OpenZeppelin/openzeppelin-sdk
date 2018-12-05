'use strict';

import pull from '../scripts/pull'
import status from '../scripts/status'
import compare from '../scripts/compare'
import Initializer from '../models/initializer/Initializer'

const name = 'status'
const signature = name
const description = 'print information about the local status of your app in a specific network'

const register = program => program
  .command(signature, { noHelp: true })
  .description(description)
  .usage('--network <network>')
  .option('--fetch', 'retrieve app information directly from the network instead of from the local network file')
  .option('--fix', 'update local network file with information retrieved from the network')
  .withNetworkOptions()
  .action(action)

async function action(options) {
  const { network, txParams } = await Initializer.call(options)

  if (options.fix) await pull({ network, txParams })
  else if (options.fetch) await compare({ network, txParams })
  else await status({ network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

export default { name, signature, description, register, action }
