'use strict';

import publish from '../scripts/publish'
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer'

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
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options)
  await await publish({ network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

export default { name, signature, description, register, action }
