'use strict';

import publish from '../scripts/publish'
import Initializer from '../models/initializer/Initializer'

const name = 'publish'
const signature = `${name}`
const description = 'publishes your project to the selected network'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .withNetworkOptions()
  .action(action)

async function action(options) {
  const { network, txParams } = await Initializer.call(options)
  await await publish({ network, txParams })
}

export default { name, signature, description, register, action }
