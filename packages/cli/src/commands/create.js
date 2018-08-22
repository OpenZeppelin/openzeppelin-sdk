'use strict';

import createProxy from '../scripts/create'
import runWithTruffle from '../utils/runWithTruffle'
import { parseInit } from '../utils/input'
import { fromContractFullName } from '../utils/naming';
import _ from 'lodash';

const name = 'create'
const signature = `${name} <alias>`
const description = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<alias> --network <network> [options]')
  .description(description)
  .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
  .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
  .option('--force', 'force creation even if contracts have local modifications')
  .withNetworkOptions()
  .action(action)

async function action(contractFullName, options) {
  const { initMethod, initArgs } = parseInit(options, 'initialize')
  const { force } = options
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName)
  const args = _.pickBy({ packageName, contractAlias, initMethod, initArgs, force })
  await runWithTruffle(async (opts) => await createProxy({ ... args, ... opts }), options)
}

export default { name, signature, description, register, action }
