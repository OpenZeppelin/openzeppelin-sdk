'use strict';

import push from '../scripts/push'
import runWithTruffle from '../utils/runWithTruffle'

const name = 'push'
const signature = name
const description = 'deploys your project to the specified <network>'

const register = program => program
  .command(signature, {noHelp: true})
  .description(description)
  .usage('--network <network> [options]')
  .option('-f, --from <from>', 'specify transaction sender address')
  .option('-n, --network <network>', 'network to be used')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .option('--skip-compile', 'skips contract compilation')
  .option('-d, --deploy-stdlib', 'deploys a copy of the stdlib for development')
  .option('--reset', 'redeploys all contracts (not only the ones that changed)')
  .action(action)

async function action(options) {
  const { from, network, skipCompile, deployStdlib, reupload, timeout } = options
  const txParams = from ? { from } : {}
  await runWithTruffle(async () => await push({ network, deployStdlib, reupload, txParams }), network, { compile: !skipCompile, timeout })
}

export default { name, signature, description, register, action }
