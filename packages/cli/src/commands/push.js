'use strict';

import _ from 'lodash'
import push from '../scripts/push'
import Compiler from '../models/compiler/Compiler'
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer'

const name = 'push'
const signature = name
const description = 'deploys your project to the specified <network>'

const register = program => program
  .command(signature, {noHelp: true})
  .description(description)
  .usage('--network <network> [options]')
  .option('--skip-compile', 'skips contract compilation')
  .option('-d, --deploy-dependencies', 'deploys dependencies to the network if there is no existing deployment')
  .option('--reset', 'redeploys all contracts (not only the ones that changed)')
  .option('-f, --force', 'ignores validation errors and deploys contracts')
  .withNetworkOptions()
  .action(action)

async function action(options) {
  const {  deployDependencies, force, reset: reupload } = options
  if (!options.skipCompile) await Compiler.call()
  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration(options)
  await push({ force, deployDependencies, reupload, network, txParams })
  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0)
}

async function tryAction(externalOptions) {
  if (!externalOptions.push) return;
  const options = _.omit(externalOptions, 'push');
  const network = _.isString(externalOptions.push) ? externalOptions.push : undefined;
  if (network) options.network = network;
  return action(options)
}

export default { name, signature, description, register, action, tryAction }
