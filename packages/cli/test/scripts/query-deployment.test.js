'use strict';
require('../setup');

import { random } from 'lodash';
import { accounts } from '@openzeppelin/test-environment';

import queryDeployment from '../../src/scripts/query-deployment';
import ProjectFile from '../../src/models/files/ProjectFile';
import NetworkFile from '../../src/models/files/NetworkFile';

const should = require('chai').should();

describe('query-deployment script', function() {
  const [owner, another] = accounts;

  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };

  const shouldHandleQueryDeploymentScript = function() {
    beforeEach('setup', async function() {
      this.networkFile = new NetworkFile(this.projectFile, network);

      this.salt = random(0, 2 ** 32);
    });

    it('should query deployment address', async function() {
      const address = await queryDeployment({
        salt: this.salt,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      address.should.be.nonzeroAddress;
    });

    it('should query deployment address specifying sender', async function() {
      const address = await queryDeployment({
        salt: this.salt,
        network,
        txParams: { from: another },
        networkFile: this.networkFile,
      });
      const addressWithSender = await queryDeployment({
        salt: this.salt,
        sender: another,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      addressWithSender.should.be.eq(address);
    });

    it('should return consistent deployment addresses', async function() {
      const address1 = await queryDeployment({
        salt: this.salt,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      const address2 = await queryDeployment({
        salt: this.salt,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      address1.should.be.eq(address2);
    });

    it('should deploy proxy factory', async function() {
      should.not.exist(this.networkFile.proxyFactoryAddress);
      await queryDeployment({
        salt: this.salt,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      should.exist(this.networkFile.proxyFactoryAddress);
    });

    it('should depend on sender address', async function() {
      const address1 = await queryDeployment({
        salt: this.salt,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      const address2 = await queryDeployment({
        salt: this.salt,
        network,
        txParams: { from: another },
        networkFile: this.networkFile,
      });
      address1.should.not.be.eq(address2);
    });

    it('should validate malformed salt', async function() {
      await queryDeployment({
        salt: 'INVALID',
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/invalid salt/i);
    });

    it('should validate empty salt', async function() {
      await queryDeployment({
        salt: '',
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/empty salt/i);
    });
  };

  describe('on unpublished project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = false;
    });

    shouldHandleQueryDeploymentScript();
  });

  describe('on published project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
      this.projectFile.version = version;
    });

    shouldHandleQueryDeploymentScript();
  });
});
