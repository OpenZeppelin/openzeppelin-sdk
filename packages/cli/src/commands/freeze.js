'use strict'

import freeze from '../scripts/freeze'
import runWithTruffle from '../utils/runWithTruffle'

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
  await runWithTruffle(async (opts) => await freeze(opts), options)
}

export default { name, signature, description, register, action }
