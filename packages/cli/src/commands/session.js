'use strict';

import session from '../scripts/session';

const signature = 'session'
const description = 'by providing --network <network>, commands like create, freeze, push, status and upgrade will use <network> unless overriden. Use --close to undo.'
const register = program =>
  program
    .command(signature, { noHelp: false })
    .usage('Either --network <network> or --close')
    .option('--network <network>')
    .option('--close')
    .description(description)
    .action(session)

module.exports = { signature, description, register }
