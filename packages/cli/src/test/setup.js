import fs from 'fs-extra';

process.env.NODE_ENV = 'test';

import { ZWeb3, Contracts, Loggy, assertions } from '@openzeppelin/upgrades';
import * as Compiler from '../models/compiler/Compiler';
import * as transpiler from './../transpiler';
import { provider } from '@openzeppelin/test-environment';

import { OPEN_ZEPPELIN_FOLDER } from '../models/files/constants';
import Dependency from '../models/dependency/Dependency';
import ProjectFile from '../models/files/ProjectFile';
import NetworkFile from '../models/files/NetworkFile';

import chaiAsPromised from 'chai-as-promised';
import chaiString from 'chai-string';
import sinonChai from 'sinon-chai';

fs.ensureDirSync(OPEN_ZEPPELIN_FOLDER);
useTestProjectFile();
doNotInstallStdlib();
ZWeb3.initialize(provider);
setArtifactDefaults();
Loggy.silent(false);
Loggy.testing(true);

require('chai')
  .use(chaiAsPromised)
  .use(chaiString)
  .use(assertions)
  .use(sinonChai)
  .should();

// TODO: Replace with fs mock or create openzeppelin folder and remove it later
function useTestProjectFile() {
  ProjectFile.prototype.write = () => undefined;
  NetworkFile.prototype.write = () => undefined;
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

  const defaults = process.env.SOLIDITY_COVERAGE ? DEFAULT_COVERAGE_TX_PARAMS : DEFAULT_TESTING_TX_PARAMS;
  Contracts.setArtifactsDefaults(defaults);
}

export function stubContractUpgradeable(sandbox) {
  beforeEach('stub getFromPathWithUpgradeable to simulate transpilation of contracts', async function() {
    // stub getFromPathWithUpgradeable to fill upgradeable field with the same contract
    sandbox.stub(Contracts, 'getFromPathWithUpgradeable').callsFake(function(targetPath, contractName) {
      const contract = Contracts.getFromPathWithUpgradeable.wrappedMethod.apply(this, [targetPath, contractName]);
      contract.upgradeable = contract;
      return contract;
    });
    sandbox.stub(Compiler, 'compile');
    sandbox.stub(transpiler, 'transpileAndSave');
  });

  afterEach(function() {
    sandbox.restore();
  });
}
