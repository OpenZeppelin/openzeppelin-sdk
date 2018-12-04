#! /usr/bin/env node

import log from '../helpers/log'
import parseArgs from 'minimist'
import deploy from '../scripts/deploy'
import { Initializer } from 'zos'

const params = parseArgs(process.argv.slice(2), { string: 'from' })
const { network, from } = params

if (!network) log.error('Please specify a network using -network=<network>.')
if (!from)    log.error('Please specify a sender address using -from=<addr>.')

if (network && from) {
  Initializer.call()
    .then(({ network, txParams }) => deploy({ network, txParams }).then(console.log).catch(console.error))
    .catch(console.error)
}
