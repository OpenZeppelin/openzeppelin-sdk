'use strict';

import Truffle from '../models/truffle/Truffle'
import check from '../scripts/check';

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
  if (!options.skipCompile) await Truffle.compile();
  check({ contractAlias });
}

export default { name, signature, description, register, action }
