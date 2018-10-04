// module information
const version = 'v' + require('../package.json').version

// model objects
import commands from './commands'
import scripts from './scripts'
import local from './models/local'
import network from './models/network'
import TestHelper from './models/TestHelper'
import runWithTruffle from './utils/runWithTruffle'

export {
  version,
  local,
  network,
  commands,
  scripts,
  runWithTruffle,
  TestHelper,
}
