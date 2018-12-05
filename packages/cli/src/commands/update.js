'use strict';

import _ from 'lodash'
import update from '../scripts/update'
import { parseInit } from '../utils/input'
import { fromContractFullName } from '../utils/naming'
import Initializer from '../models/initializer/Initializer'

const name = 'update'
const signature = `${name} [alias-or-address]`
const description = 'update contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to update all contracts in your project.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[alias-or-address] --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after upgrading contract. If no name is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--all', 'update all contracts in the application')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action)

async function action(contractFullNameOrAddress, options) {
  const { initMethod, initArgs } = parseInit(options, 'initialize')
  const { all, force } = options
  
  let proxyAddress, contractAlias, packageName
  if (contractFullNameOrAddress && contractFullNameOrAddress.startsWith('0x')) {
    proxyAddress = contractFullNameOrAddress
  } else if (contractFullNameOrAddress) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractFullNameOrAddress))
  }
  
  const args = _.pickBy({ contractAlias, packageName, proxyAddress, initMethod, initArgs, all, force })
  const { network, txParams } = await Initializer.call(options)
  await update({ ...args, network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

export default { name, signature, description, register, action }
