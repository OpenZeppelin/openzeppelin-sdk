import fs from 'fs-extra';

process.env.NODE_ENV = 'test';

import { ZWeb3, Contracts, Loggy } from '@openzeppelin/upgrades';
import { OPEN_ZEPPELIN_FOLDER } from '../src/models/files/constants';
import Dependency from '../src/models/dependency/Dependency';
import ProjectFile from '../src/models/files/ProjectFile';
import NetworkFile from '../src/models/files/NetworkFile';
import Session from '../src/models/network/Session';

fs.ensureDirSync(OPEN_ZEPPELIN_FOLDER);
useTestProjectFile();
doNotInstallStdlib();
ZWeb3.initialize(web3.currentProvider);
setArtifactDefaults();
Loggy.silent(false);
Loggy.testing(true);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-string'))
  .use(require('@openzeppelin/upgrades').assertions)
  .use(require('sinon-chai'))
  .should();

// TODO: Replace with fs mock or create openzeppelin folder and remove it later
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
