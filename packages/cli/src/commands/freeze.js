'use strict'

import freeze from '../scripts/freeze'
import runWithTruffle from '../utils/runWithTruffle'

const name = 'freeze'
const signature = name
const description = 'freeze current release version of your stdlib project'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .option('-f, --from <from>', 'specify transaction sender address')
  .option('-n, --network <network>', 'network to be used')
  .action(action)

async function action(options) {
  const { from, network } = options
  const txParams = from ? { from } : {}
  await runWithTruffle(async () => await freeze({ network, txParams }), network)
}

export default { name, signature, description, register, action }
