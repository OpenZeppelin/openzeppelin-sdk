'use strict';

import setAdmin from '../scripts/set-admin'
import runWithTruffle from '../utils/runWithTruffle'
import { fromContractFullName } from '../utils/naming'
import _ from 'lodash'

const name = 'set-admin'
const signature = `${name} [alias-or-address] [new-admin-address]`
const description = 'change upgradeability admin of a contract instance. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[alias-or-address] [new-admin-address] --network <network> [options]')
  .description(description)
  .option('-y, --yes', 'accept transferring admin rights (required)')
  .withNetworkOptions()
  .action(action)

async function action(contractFullNameOrAddress, newAdmin, options) {
  const { yes } = options
  if (!yes) {
    throw Error("This is a potentially irreversible operation: if you specify an incorrect admin address, you may lose the ability to upgrade your contract forever.\nPlease double check all parameters, and run the same command with --yes.")
  }  

  let proxyAddress, contractAlias, packageName
  if (contractFullNameOrAddress && contractFullNameOrAddress.startsWith('0x')) {
    proxyAddress = contractFullNameOrAddress
  } else if (contractFullNameOrAddress) {
    ({ contract: contractAlias, package: packageName } = fromContractFullName(contractFullNameOrAddress))
  }
  
  const args = _.pickBy({ contractAlias, packageName, proxyAddress, newAdmin })
  await runWithTruffle(async (opts) => await setAdmin({ ... args, ... opts }), options)
}

export default { name, signature, description, register, action }
