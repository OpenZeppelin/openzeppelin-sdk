'use strict'

import unlink from '../scripts/unlink'
import push from './push'

const name = 'unlink'
const signature = `${name} [dependencies...]`
const description = 'unlinks dependencies from the project. Provide a list of whitespace-separated dependency names'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[dependencyName1... dependencyNameN]')
  .description(description)
  .withPushOptions()
  .action(action)

async function action(dependencies, options) {
  await unlink({ dependencies })
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
