'use strict';
require('../../setup');

import Package from '../../../src/application/Package';
import Contracts from '../../../src/artifacts/Contracts';
import ImplementationDirectory from '../../../src/application/ImplementationDirectory';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation');

contract('Package', function([_, owner]) {
  const txParams = { from: owner };
  const contractName = 'DummyImplementation';
  const version = [1, 0, 0];
  const version2 = [2, 0, 0];

  const shouldInitialize = function() {
    it('instantiates the package', async function() {
      this.package.contract.should.not.be.null;
      this.package.address.should.be.nonzeroAddress;
    });
  };

  const deploy = async function() {
    this.package = await Package.deploy(txParams);
  };

  describe('deploy', function() {
    beforeEach('deploying package', deploy);
    shouldInitialize();
  });

  describe('fetch', function() {
    beforeEach('deploying package', deploy);
    beforeEach('connecting to existing instance', async function() {
      this.package = Package.fetch(this.package.address, txParams);
    });
    shouldInitialize();
  });

  describe('newVersion', function() {
    beforeEach('deploying package', deploy);
    beforeEach('adding a new version', async function() {
      await this.package.newVersion(version);
    });

    it('returns version directory', async function() {
      const directory = await this.package.getDirectory(version);
      directory.address.should.be.nonzeroAddress;
      directory.should.be.instanceof(ImplementationDirectory);
    });

    it('registers new version on package', async function() {
      const hasVersion = await this.package.hasVersion(version);
      hasVersion.should.be.true;
    });

    it('is not frozen by default', async function() {
      const frozen = await this.package.isFrozen(version);
      frozen.should.be.false;
    });

    it('is freezable', async function() {
      await this.package.freeze(version);
      const frozen = await this.package.isFrozen(version);
      frozen.should.be.true;
    });
  });
});
