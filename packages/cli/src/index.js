// module information
const version = 'v' + require('../package.json').version

// commands
import commands from './commands'
import scripts from './scripts'

// model objects
import files from './models/files'
import local from './models/local'
import network from './models/network'
import TestHelper from './models/TestHelper'

// utils
import naming from './utils/naming'
import runWithZWeb3 from './utils/runWithZWeb3'
import log, { silent } from './utils/stdout'
const stdout = { log, silent }

export {
  version,
  files,
  local,
  network,
  commands,
  scripts,
  naming,
  stdout,
  runWithZWeb3,
  TestHelper,
}
