'use strict';

import upgrade from '../scripts/upgrade'
import runWithTruffle from '../utils/runWithTruffle'
import { parseInit } from '../utils/input'

const name = 'update'
const signature = `${name} [alias] [address]`
const description = 'upgrade contract to a new logic. Provide the [alias] you added your contract with, or use --all flag to upgrade all. If no [address] is provided, all instances of that contract class will be upgraded'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[alias] [address] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after upgrading contract. If no name is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--all', 'upgrade all contracts in the application')
  .option('-f, --from <from>', 'specify transaction sender address')
  .option('-n, --network <network>', 'network to be used')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .option('--force', 'force creation even if contracts have local modifications')
  .action(action)

async function action(contractAlias, proxyAddress, options) {
  const { initMethod, initArgs } = parseInit(options, 'initialize')
  const { from, network, all, force, timeout } = options
  const txParams = from ? { from } : {}
  await runWithTruffle(async () => await upgrade({ 
    contractAlias, proxyAddress, initMethod, initArgs, all, network, txParams, force 
  }), network, { timeout })
}

export default { name, signature, description, register, action }
