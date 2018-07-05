#! /usr/bin/env node

import { Logger } from 'zos-lib'
import { lockSync } from 'lockfile';
import program from './program'

// Acquire file lock to ensure no other instance is running
const LOCKFILE = '.zos.lock';
try { 
  lockSync(LOCKFILE, { retries: 0 }) 
} catch (e) { 
  console.error(`Cannot run more than one instance of 'zos' at the same time.\nIf you are sure that no other instances are actually running, manually remove the file ${LOCKFILE} and try again.`);
  process.exit(1); 
}

Logger.silent(false)
program.parse(process.argv)
if (program.args.length === 0) program.help()
