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

// validations
import { getStorageLayout } from './validations/Storage';
import { getBuildArtifacts } from './utils/BuildArtifacts';
import { compareStorageLayouts } from './validations/Layout';

// test behaviors
import { behaviors, helpers } from './test'
const assertions = helpers.assertions
const assertRevert = helpers.assertRevert

// model objects
import Proxy from './proxy/Proxy'
import App from './app/App'
import Package from './package/Package'
import ImplementationDirectory from './directory/ImplementationDirectory'
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
  getBuildArtifacts,
  getStorageLayout,
  compareStorageLayouts,
  Proxy,
  Logger,
  FileSystem,
  Contracts,
  App,
  ImplementationDirectory,
  Package,
  BasePackageProject,
  LibProject,
  AppProject,
  SimpleProject
}
