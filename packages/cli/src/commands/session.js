'use strict';

import session from '../scripts/session'

const name = 'session'
const signature = name
const description = 'by providing network options, commands like create, freeze, push, status and upgrade will use them unless overriden. Use --close to undo.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('-n, --network <network>', 'network to be used')
  .option('-f, --from <from>', 'specify transaction sender address')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
  .option('--close')
  .action(action)

function action(options) {
  session(options)
}

export default { name, signature, description, register, action }
