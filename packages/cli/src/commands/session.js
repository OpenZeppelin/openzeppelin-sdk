'use strict';

import session from '../scripts/session'

const name = 'session'
const signature = name
const description = 'by providing network options, commands like create, freeze, push, status and upgrade will use them unless overriden. Use --close to undo.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
  .option('--close', 'closes the current session, removing all network options set')
  .withNetworkOptions()
  .action(action)

function action(options) {
  session(options)
}

export default { name, signature, description, register, action }
