'use strict'

import freeze from '../scripts/freeze'
import runWithZWeb3 from '../utils/runWithZWeb3'

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
  await runWithZWeb3(async (opts) => await freeze(opts), options)
}

export default { name, signature, description, register, action }
