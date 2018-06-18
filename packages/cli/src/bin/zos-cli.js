#! /usr/bin/env node
require('zos-lib').Logger.silent(false)
let program = require('./program').parse(process.argv)

if (program.args.length === 0) {
  program.help()
}
