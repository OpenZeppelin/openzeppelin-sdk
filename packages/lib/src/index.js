// module information
const version = 'v' + require('../package.json').version

// helpers
import decodeLogs from './helpers/decodeLogs'
import encodeCall from './helpers/encodeCall'

// utils
import Proxy from './utils/Proxy'
import Logger from './utils/Logger'
import FileSystem from './utils/FileSystem'
import Contracts from './utils/Contracts'
import { sendTransaction, deploy } from './utils/Transactions'

// test behaviors
import { behaviors, helpers } from './test'
const assertions = helpers.assertions
const assertRevert = helpers.assertRevert

// model objects
import App from './app/App'
import Package from './package/Package'
import AppDirectory from './directory/AppDirectory'
import ImplementationDirectory from './directory/ImplementationDirectory'
import FreezableImplementationDirectory from './directory/FreezableImplementationDirectory'

export {
  version,
  decodeLogs,
  encodeCall,
  assertRevert,
  assertions,
  behaviors,
  sendTransaction,
  deploy,
  Proxy,
  Logger,
  FileSystem,
  Contracts,
  App,
  ImplementationDirectory,
  FreezableImplementationDirectory,
  AppDirectory,
  Package,
}
