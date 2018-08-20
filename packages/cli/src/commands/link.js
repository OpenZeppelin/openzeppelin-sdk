'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const name = 'link'
const signature = `${name} <library>`
const description = 'links project with a library located in the <library> npm package'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<library> [options]')
  .description(description)
  .option('--no-install', 'skip installing library dependencies locally')
  .withPushOptions()
  .action(action)

async function action(libNameVersion, options) {
  const installLib = options.install
  await linkStdlib({ libNameVersion, installLib })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
