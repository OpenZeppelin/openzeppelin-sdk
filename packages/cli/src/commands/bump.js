'use strict';

import push from './push'
import bump from '../scripts/bump'

const name = 'bump'
const signature = `${name} <version>`
const description = 'bump your project to a new <version>'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<version> [options]')
  .description(description)
  .withPushOptions()
  .action(action)

async function action(version, options) {
  await bump({ version })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
