// module information
const version = 'v' + require('../package.json').version;

// helpers
import encodeCall from './helpers/encodeCall';
import sleep from './helpers/sleep';

// utils
import ABI from './utils/ABIs';
import Semver from './utils/Semver';
import Logger from './utils/Logger';
import FileSystem from './utils/FileSystem';
import Contracts from './artifacts/Contracts';
import Contract from './artifacts/Contract';
import ZWeb3 from './artifacts/ZWeb3';
import { bodyCode, constructorCode, bytecodeDigest, replaceSolidityLibAddress, isSolidityLib, getSolidityLibNames } from './utils/Bytecode';
import Transactions from './utils/Transactions';
import { flattenSourceCode } from './utils/Solidity';
import { semanticVersionEqual, toSemanticVersion, semanticVersionToString } from './utils/Semver';
import AppProxyMigrator from './utils/Migrator';

// validations
import { getStorageLayout, getStructsOrEnums, StorageLayoutInfo } from './validations/Storage';
import { getBuildArtifacts, BuildArtifacts } from './artifacts/BuildArtifacts';
import { compareStorageLayouts, Operation } from './validations/Layout';
import { validate, newValidationErrors, validationPasses, ValidationInfo } from './validations';

// test behaviors
import { behaviors, helpers } from './test';
const assertions = helpers.assertions;
const assertRevert = helpers.assertRevert;
const assertEvent = helpers.assertEvent;

// model objects
import Proxy from './proxy/Proxy';
import ProxyAdmin from './proxy/ProxyAdmin';
import App from './application/App';
import Package from './application/Package';
import ImplementationDirectory from './application/ImplementationDirectory';
import BasePackageProject from './project/BasePackageProject';
import PackageProject from './project/PackageProject';
import AppProject from './project/AppProject';
import SimpleProject from './project/SimpleProject';
import ProxyAdminProject from './project/ProxyAdminProject';

export {
  version,
  encodeCall,
  assertRevert,
  assertEvent,
  assertions,
  behaviors,
  getBuildArtifacts,
  BuildArtifacts,
  getStorageLayout,
  StorageLayoutInfo,
  compareStorageLayouts,
  Operation,
  getStructsOrEnums,
  validate,
  newValidationErrors,
  validationPasses,
  bodyCode,
  constructorCode,
  bytecodeDigest,
  flattenSourceCode,
  semanticVersionEqual,
  toSemanticVersion,
  semanticVersionToString,
  replaceSolidityLibAddress,
  getSolidityLibNames,
  isSolidityLib,
  sleep,
  Proxy,
  Logger,
  ABI,
  Semver,
  FileSystem,
  ZWeb3,
  Transactions,
  Contracts,
  App,
  ProxyAdmin,
  ImplementationDirectory,
  Package,
  BasePackageProject,
  PackageProject,
  AppProject,
  SimpleProject,
  Contract,
  ProxyAdminProject,
  ValidationInfo,
  AppProxyMigrator
};
