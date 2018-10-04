'use strict';

import push from './push'
import init from '../scripts/init'
import initLib from '../scripts/init-lib'

const name = 'init'
const signature = `${name} <project-name> [version]`
const description = `initialize your ZeppelinOS project. Provide a <project-name> and optionally an initial [version] name`

const register = program => program
  .command(signature, { noHelp: true })
  .usage('<project-name> [version]')
  .description(description)
  .option('--light', 'create a lightweight application, which will cause the contracts directory and application package to be managed entirely off-chain instead of published to the network')
  .option('--lib', 'create a standard library instead of an application')
  .option('--force', 'overwrite existing project if there is one')
  .option('--link <stdlib>', 'link to a standard library')
  .option('--no-install', 'skip installing stdlib dependencies locally')
  .withPushOptions()
  .action(action)

async function action(name, version, options) {
  const { light: lightweight, force, link, install: installLibs } = options

  if (options.lib) {
    if (link) throw Error('Cannot set a stdlib in a library project')
    if (lightweight) throw Error('Cannot create a lightweight library project')
    await initLib({ name, version, force })
  } else {
    const libs = link ? link.split(',') : []
    await init({ name, version, libs, installLibs, force, lightweight })
  }
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
