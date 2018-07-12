'use strict';

import compare from '../scripts/compare'
import runWithTruffle from '../utils/runWithTruffle'

const name = 'compare'
const signature = name
const description = 'print information about the deployment of your app in a specific network comparing it to your local status'

const register = program => program
  .command(signature, { noHelp: true })
  .description(description)
  .usage('--network <network>')
  .option('-n, --network <network>', 'network to be used')
  .action(action)

async function action(options) {
  await runWithTruffle(async (opts) => await compare(opts), options)
}

export default { name, signature, description, register, action }
