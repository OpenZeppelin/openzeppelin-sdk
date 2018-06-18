#! /usr/bin/env node
require('zos-lib').Logger.silent(false)
const program = require('./program')
program.parse(process.argv)
if (program.args.length === 0) program.help()
