'use strict';

import push from '../scripts/push'
import runWithTruffle from '../utils/runWithTruffle'
import _ from 'lodash'

const name = 'push'
const signature = name
const description = 'deploys your project to the specified <network>'

const register = program => program
  .command(signature, {noHelp: true})
  .description(description)
  .usage('--network <network> [options]')
  .option('--skip-compile', 'skips contract compilation')
  .option('-d, --deploy-stdlib', 'deploys a copy of the stdlib for development')
  .option('--reset', 'redeploys all contracts (not only the ones that changed)')
  .withNetworkOptions()
  .action(action)

async function action(options) {
  const { skipCompile, deployStdlib, reupload } = options
  await runWithTruffle(
    async (opts) => await push({ deployStdlib, reupload, ... opts }),
    { compile: !skipCompile, ... options }
  )
}

async function tryAction(externalOptions) {
  if (!externalOptions.push) return;
  const options = _.omit(externalOptions, 'push');
  const network = _.isString(externalOptions.push) ? externalOptions.push : undefined;
  if (network) options.network = network;
  return action(options)
}

export default { name, signature, description, register, action, tryAction }
