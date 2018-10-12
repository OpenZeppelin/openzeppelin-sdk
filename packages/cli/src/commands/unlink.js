'use strict'

import unlink from '../scripts/unlink'
import push from './push'

const name = 'unlink'
const signature = `${name} [packages...]`
const description = 'unlinks packages from the project. Provide a list of whitespace-separated package names'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[packageName1 ... packageNameN]')
  .description(description)
  .withPushOptions()
  .action(action)

async function action(libNames, options) {
  await unlink({ libNames })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
