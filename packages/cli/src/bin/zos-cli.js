#! /usr/bin/env node

import { Logger } from 'zos-lib'
import program from './program'

Logger.silent(false)
program.parse(process.argv)
if (program.args.length === 0) program.help()
