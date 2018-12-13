'use strict';

import check from '../scripts/check'
import Compiler from '../models/compiler/Compiler'
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer'

const name = 'check'
const signature = `${name} [contract]`
const description = 'checks your contracts for potential issues'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[contract] [options]')
  .description(description)
  .option('--skip-compile', 'skips contract compilation')
  .action(action)

async function action(contractAlias, options) {
  ConfigVariablesInitializer.initStaticConfiguration()
  if (!options.skipCompile) await Compiler.call()
  check({ contractAlias })
}

export default { name, signature, description, register, action }
