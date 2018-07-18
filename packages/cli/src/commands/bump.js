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
  .option('--link <stdlib>', 'link to new standard library version')
  .option('--no-install', 'skip installing stdlib dependencies locally')
  .withPushOptions()
  .action(action)

async function action(version, options) {
  const { link: stdlibNameVersion, install: installLib } = options
  await bump({ version, stdlibNameVersion, installLib })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
