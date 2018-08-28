'use strict';

import push from './push'
import linkStdlib from '../scripts/link'

const name = 'link'
const signature = `${name} [libraries...]`
const description = 'links project with a list of libraries located in each library npm package'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[libraryName1 ... libraryNameN] [options]')
  .description(description)
  .option('--no-install', 'skip installing library dependencies locally')
  .withPushOptions()
  .action(action)

async function action(libs, options) {
  const installLibs = options.install
  await linkStdlib({ libs, installLibs })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
