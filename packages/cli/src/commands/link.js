'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const name = 'link'
const signature = `${name} <stdlib>`
const description = 'links project with a standard library located in the <stdlib> npm package'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<stdlib> [options]')
  .description(description)
  .option('--no-install', 'skip installing stdlib dependencies locally')
  .withPushOptions()
  .action(action)

async function action(stdlibNameVersion, options) {
  const installLib = options.install
  await linkStdlib({ stdlibNameVersion, installLib })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
