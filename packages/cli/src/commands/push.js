'use strict';

import push from '../scripts/push'
import runWithTruffle from '../utils/runWithTruffle'

const signature = 'push'
const description = 'deploys your project to the specified <network>'
function registerPush(program) {
  program
    .command(signature, {noHelp: true})
    .description(description)
    .usage('--network <network> [options]')
    .option('-f, --from <from>', 'specify transaction sender address')
    .option('-n, --network <network>', 'network to be used')
    .option('--skip-compile', 'skips contract compilation')
    .option('-d, --deploy-stdlib', 'deploys a copy of the stdlib for development')
    .option('--reset', 'redeploys all contract implementations (not only the ones that changed)')
    .action(action)
}

function action(options) {
  const { from, network, skipCompile, deployStdlib, reupload } = options
  const txParams = from ? { from } : {}
  runWithTruffle(async () => await push({ network, deployStdlib, reupload, txParams }), network, ! skipCompile)
}

module.exports = { signature, description, register: registerPush, action}
