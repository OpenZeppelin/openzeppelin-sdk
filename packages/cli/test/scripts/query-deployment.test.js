'use strict'
require('../setup')

import random from 'lodash.random';
import queryDeployment from '../../src/scripts/query-deployment';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

const should = require('chai').should();

contract('query-deployment script', function([_, owner, another]) {
  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };

  const shouldHandleQueryDeploymentScript = function() {
    beforeEach('setup', async function() {
      this.networkFile = this.packageFile.networkFile(network);
      this.salt = random(0, 2**32);
    });

    it('should query deployment address', async function() {
      const address = await queryDeployment({ salt: this.salt, network, txParams, networkFile: this.networkFile });
      address.should.be.nonzeroAddress;
    });

    it('should return consistent deployment addresses', async function() {
      const address1 = await queryDeployment({ salt: this.salt, network, txParams, networkFile: this.networkFile });
      const address2 = await queryDeployment({ salt: this.salt, network, txParams, networkFile: this.networkFile });
      address1.should.be.eq(address2);
    });

    it('should deploy proxy factory', async function() {
      should.not.exist(this.networkFile.proxyFactoryAddress);
      await queryDeployment({ salt: this.salt, network, txParams, networkFile: this.networkFile });
      should.exist(this.networkFile.proxyFactoryAddress);
    });

    it('should depend on sender address', async function() {
      const address1 = await queryDeployment({ salt: this.salt, network, txParams, networkFile: this.networkFile });
      const address2 = await queryDeployment({ salt: this.salt, network, txParams: { from: another }, networkFile: this.networkFile });
      address1.should.not.be.eq(address2);
    });

    it('should validate malformed salt', async function() {
      await queryDeployment({ salt: "INVALID", network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/invalid salt/i);
    });

    it('should validate empty salt', async function() {
      await queryDeployment({ salt: "", network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/empty salt/i);
    });
  }
  
  describe('on unpublished project', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.packageFile.version = version
      this.packageFile.publish = false
    });

    shouldHandleQueryDeploymentScript();
  })

  describe('on published project', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-empty.zos.json')
      this.packageFile.version = version
    });

    shouldHandleQueryDeploymentScript();
  })
  
});
