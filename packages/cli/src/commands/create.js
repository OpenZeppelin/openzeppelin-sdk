'use strict';

import createProxy from '../scripts/create'
import runWithTruffle from '../utils/runWithTruffle'
import { parseInit } from '../utils/input'

const name = 'create'
const signature = `${name} <alias>`
const description = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<alias> --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('-f, --from <from>', 'specify transaction sender address')
  .option('-n, --network <network>', 'network to be used')
  .option('--force', 'force creation even if contracts have local modifications')
  .action(action)

async function action(contractAlias, options) {
  const { initMethod, initArgs } = parseInit(options, 'initialize')
  const { from, network, force } = options
  const txParams = from ? { from } : {}
  await runWithTruffle(async () => await createProxy({ contractAlias, initMethod, initArgs, network, txParams, force }), network)
}

export default { name, signature, description, register, action }
