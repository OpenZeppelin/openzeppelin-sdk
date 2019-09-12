'use strict';
require('../setup');

import { Package } from '@openzeppelin/upgrades';
import push from '../../src/scripts/push';
import freeze from '../../src/scripts/freeze';
import ProjectFile from '../../src/models/files/ProjectFile';
import NetworkFile from '../../src/models/files/NetworkFile';

contract('freeze script', function([_, owner]) {
  const network = 'test';
  const txParams = { from: owner };

  beforeEach('init package file', async function() {
    this.projectFile = new ProjectFile('test/mocks/packages/package-with-contracts.zos.json');
  });

  describe('for an unpublished app', function() {
    beforeEach('push lib', async function() {
      this.projectFile.publish = false;
      this.networkFile = new NetworkFile(this.projectFile, network);

      await push({ networkFile: this.networkFile, network, txParams });
    });

    it('should reject to freeze', async function() {
      await freeze({
        networkFile: this.networkFile,
        network,
        txParams,
      }).should.be.rejectedWith('Cannot freeze an unpublished project');
    });
  });

  describe('for a published app', function() {
    beforeEach('push lib', async function() {
      this.networkFile = new NetworkFile(this.projectFile, network);

      await push({ networkFile: this.networkFile, network, txParams });
    });

    it('should be marked as frozen', async function() {
      await freeze({ networkFile: this.networkFile, network, txParams });

      this.networkFile.frozen.should.be.true;
    });

    it('should freeze the requested release', async function() {
      await freeze({ networkFile: this.networkFile, network, txParams });

      const _package = Package.fetch(this.networkFile.packageAddress, txParams);
      const frozen = await _package.isFrozen(this.networkFile.version);
      frozen.should.be.true;
    });
  });
});
