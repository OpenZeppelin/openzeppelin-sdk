#! /usr/bin/env node

import log from '../helpers/log'
import parseArgs from 'minimist'
import verify from '../scripts/verify'
import { Initializer } from 'zos'

const params = parseArgs(process.argv.slice(2), { string: 'from' })
const { network, from } = params

if (!network) log.error('Please specify a network using -network=<network>.')
if (!from)    log.error('Please specify a sender address using -from=<addr>.')

if (network && from) {
  Initializer.call()
    .then(({ network, txParams }) => verify({ network, txParams }).then(console.log).catch(console.error))
    .catch(console.error)
}
