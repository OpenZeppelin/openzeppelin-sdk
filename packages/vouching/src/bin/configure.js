#! /usr/bin/env node

import parseArgs from 'minimist'
import configure from '../scripts/configure'
import runWithTruffle from 'zos/lib/utils/runWithTruffle'

const params = parseArgs(process.argv.slice(2), { string: 'from' })
const { network, from } = params

if (!network) throw new Error('Please specify a network using --network=<network>.')
if (!from)    throw new Error('Please specify a sender address using --from=<addr>.')

runWithTruffle(options => configure(options), { network, from })
  .then(console.log)
  .catch(console.error)
