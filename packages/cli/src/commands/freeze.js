'use strict'

import freeze from '../scripts/freeze'
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer'

const name = 'freeze'
const signature = name
const description = 'freeze current release version of your published project'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .withNetworkOptions()
  .action(action)

async function action(options) {
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options)
  await freeze({ network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

export default { name, signature, description, register, action }
