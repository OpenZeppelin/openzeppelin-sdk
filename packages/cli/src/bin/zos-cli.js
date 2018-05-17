#! /usr/bin/env node
require('zos-lib').Logger.silent(false)
require('./program').parse(process.argv)
