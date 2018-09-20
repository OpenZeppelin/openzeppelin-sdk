// module information
const version = 'v' + require('../package.json').version

// helpers
import decodeLogs from './helpers/decodeLogs'
import encodeCall from './helpers/encodeCall'

// utils
import Logger from './utils/Logger'
import FileSystem from './utils/FileSystem'
import Contracts from './utils/Contracts'
import { sendTransaction, deploy } from './utils/Transactions'

// test behaviors
import { behaviors, helpers } from './test'
const assertions = helpers.assertions
const assertRevert = helpers.assertRevert

// model objects
import Proxy from './proxy/Proxy'
import UnversionedApp from './app/UnversionedApp'
import VersionedApp from './app/VersionedApp'
import Package from './package/Package'
import ImplementationDirectory from './directory/ImplementationDirectory'
import FreezableImplementationDirectory from './directory/FreezableImplementationDirectory'
import BasePackageProject from './project/BasePackageProject'
import LibProject from './project/LibProject'
import AppProject from './project/AppProject'
import SimpleProject from './project/SimpleProject'

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
  VersionedApp,
  UnversionedApp,
  ImplementationDirectory,
  FreezableImplementationDirectory,
  Package,
  BasePackageProject,
  LibProject,
  AppProject,
  SimpleProject
}
