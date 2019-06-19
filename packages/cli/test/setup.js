process.env.NODE_ENV = 'test';

import { ZWeb3, Contracts, Loggy } from 'zos-lib';
import Dependency from '../src/models/dependency/Dependency';
import ProjectFile from '../src/models/files/ProjectFile';
import NetworkFile from '../src/models/files/NetworkFile';

useTestProjectFile();
doNotInstallStdlib();
ZWeb3.initialize(web3.currentProvider);
setArtifactDefaults();
Loggy.silent(true);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-string'))
  .use(require('zos-lib').assertions)
  .use(require('sinon-chai'))
  .should();

function useTestProjectFile() {
  ProjectFile.prototype.write = () => {};
  NetworkFile.prototype.write = () => {};
}

function doNotInstallStdlib() {
  Dependency.installFn = Dependency.install;
  Dependency.install = Dependency.fromNameWithVersion;
}

function setArtifactDefaults() {
  const DEFAULT_TESTING_TX_PARAMS = {
    gas: 6721975,
    gasPrice: 100000000000,
  };

  const DEFAULT_COVERAGE_TX_PARAMS = {
    gas: 0xfffffffffff,
    gasPrice: 0x01,
  };

  const defaults = process.env.SOLIDITY_COVERAGE
    ? DEFAULT_COVERAGE_TX_PARAMS
    : DEFAULT_TESTING_TX_PARAMS;
  Contracts.setArtifactsDefaults(defaults);
}
