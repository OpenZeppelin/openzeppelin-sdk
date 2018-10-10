#! /usr/bin/env node

import log from '../helpers/log'
import parseArgs from 'minimist'
import create from '../scripts/create'
import { silent } from 'zos/lib/utils/stdout'
import runWithTruffle from 'zos/lib/utils/runWithTruffle'

const params = parseArgs(process.argv.slice(2), { string: 'from' })
const { network, from } = params

if (!network) log.error('Please specify a network using --network=<network>.')
if (!from)    log.error('Please specify a sender address using --from=<addr>.')

if (network && from) {
  silent(true)
  runWithTruffle(options => create(options), { network, from })
    .then(console.log)
    .catch(console.error)
}
