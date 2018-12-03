'use strict';

import verify from '../scripts/verify'
import runWithZWeb3 from '../utils/runWithZWeb3'

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
  .option('--api-key <key>', 'specify etherscan API key. To get one, go to: https://etherscancom.freshdesk.com/support/solutions/articles/35000022163-i-need-an-api-key')
  .action(action);


function action(contractAlias, options) {
  const { optimizer, optimizerRuns } = options
  if (optimizer && !optimizerRuns) {
    throw new Error('Cannot verify contract without defining optimizer runs')
  }
  runWithZWeb3(opts => verify(contractAlias, { ...options, ...opts }), options)
}

export default { name, signature, description, register, action }

