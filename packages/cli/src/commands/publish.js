'use strict';

import publish from '../scripts/publish'
import runWithTruffle from '../utils/runWithTruffle'
import _ from 'lodash';

const name = 'publish'
const signature = `${name}`
const description = 'publishes your project to the selected network'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('--network <network> [options]')
  .description(description)
  .withNetworkOptions()
  .action(action)

async function action(options) {
  await runWithTruffle(async (opts) => await publish(opts), options)
}

export default { name, signature, description, register, action }
