'use strict';

import verify from '../scripts/verify'
import Initializer from '../models/initializer/Initializer'

const name = 'verify'
const signature = `${name} <contract-alias>`
const description = 'verify a contract with etherchain. Provide a contract name.'

const register = program => program
  .command(signature, { noHelp: true })
  .description(description)
  .option('-n, --network <network>', 'network where to verify the contract')
  .option('-o, --optimizer', 'enables optimizer option')
  .option('--optimizer-runs <runs>', 'specify number of runs if optimizer enabled.')
  .option('--remote <remote>', 'specify remote endpoint to use for verification')
  .option('--api-key <key>', 'specify etherscan API key. To get one, go to: https://etherscan.io/myapikey')
  .action(action);


async function action(contractAlias, options) {
  const { optimizer, optimizerRuns } = options
  if (optimizer && !optimizerRuns) {
    throw new Error('Cannot verify contract without defining optimizer runs')
  }
  const { network, txParams } = await Initializer.init(options)
  await verify(contractAlias, { ...options, network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

export default { name, signature, description, register, action }
