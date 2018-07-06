'use strict';

import remove from '../scripts/remove'
import push from './push'

const name = 'remove'
const signature = `${name} [contracts...]`
const description = 'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.'

const register = program => program
  .command(signature, { noHelp: true })
  .alias('rm')
  .usage('[contract1 ... contractN] [options]')
  .description(description)
  .option('--push [network]', 'push all changes to the specified network after removing')
  .option('-f, --from <from>', 'specify the transaction sender address for --push')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .action(action)

async function action(contracts, options) {
  remove({ contracts })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
