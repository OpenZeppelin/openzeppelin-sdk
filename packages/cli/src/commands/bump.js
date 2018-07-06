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
  .option('--push [network]', 'push changes to the specified network after bumping version')
  .option('--timeout <timeout>', 'timeout in seconds for blockchain transactions')
  .option('-f, --from <from>', 'specify transaction sender address for --push')
  .action(action)

async function action(version, options) {
  const { link: stdlibNameVersion, install: installLib } = options
  await bump({ version, stdlibNameVersion, installLib })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
