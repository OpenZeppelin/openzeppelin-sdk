'use strict';

import session from '../scripts/session'

const name = 'session'
const signature = name
const description = 'by providing --network <network>, commands like create, freeze, push, status and upgrade will use <network> unless overriden. Use --close to undo.'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[options]')
  .description(description)
  .option('--network <network>')
  .option('--close')
  .action(action)

function action(options) {
  const { network, close } = options
  session({ network, close })
}

export default { name, signature, description, register, action }
