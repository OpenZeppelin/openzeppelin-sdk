'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const name = 'link'
const signature = `${name} [dependencies...]`
const description = 'links project with a list of dependencies each located in its npm package'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[dependencyName1 ... dependencyNameN] [options]')
  .description(description)
  .option('--no-install', 'skip installing packages dependencies locally')
  .withPushOptions()
  .action(action)

async function action(libs, options) {
  const installLibs = options.install
  await linkStdlib({ libs, installLibs })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
