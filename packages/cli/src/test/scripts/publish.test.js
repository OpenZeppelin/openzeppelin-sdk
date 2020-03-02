'use strict';
require('../setup');

import { App, Package, ImplementationDirectory, Proxy } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import publish from '../../scripts/publish';
import push from '../../scripts/push';
import create from '../../scripts/create';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';

const should = require('chai').should();

describe('publish script', function() {
  const [owner] = accounts;

  const network = 'test';
  const txParams = { from: owner };
  const defaultVersion = '1.1.0';
  const projectName = 'Herbs';
  const contractName = 'ImplV1';
  const dependencyName = 'mock-stdlib-undeployed';

  beforeEach('pushing package', async function() {
    const projectFile = new ProjectFile('mocks/packages/package-with-contracts-and-stdlib.zos.json');
    projectFile.publish = false;
    this.networkFile = new NetworkFile(projectFile, network);

    await push({
      network,
      txParams,
      networkFile: this.networkFile,
      deployDependencies: true,
    });
    this.previousContractAddress = this.networkFile.contract(contractName).address;
    this.previousDependencyAddress = this.networkFile.getDependency(dependencyName).package;
  });

  describe('before publishing', function() {
    it('should have no package contracts', async function() {
      should.not.exist(this.networkFile.packageAddress);
      should.not.exist(this.networkFile.providerAddress);
      should.not.exist(this.networkFile.appAddress);
    });
  });

  describe('publishing an app', function() {
    beforeEach('publishing', async function() {
      await publish({ network, txParams, networkFile: this.networkFile });
    });

    it('should log contracts addresses in network file', async function() {
      this.networkFile.appAddress.should.be.nonzeroAddress;
      this.networkFile.packageAddress.should.be.nonzeroAddress;
      this.networkFile.providerAddress.should.be.nonzeroAddress;
    });

    it('should deploy contracts at logged addresses', async function() {
      const app = await App.fetch(this.networkFile.appAddress);
      (await app.getPackage(projectName)).package.address.should.eq(this.networkFile.packageAddress);

      const thepackage = Package.fetch(this.networkFile.packageAddress);
      (await thepackage.getDirectory(defaultVersion)).address.should.eq(this.networkFile.providerAddress);

      const provider = ImplementationDirectory.fetch(this.networkFile.providerAddress);
      (await provider.getImplementation(contractName)).should.be.nonzeroAddress;
    });

    it('should reuse deployed implementations', async function() {
      const provider = ImplementationDirectory.fetch(this.networkFile.providerAddress);
      (await provider.getImplementation(contractName)).should.eq(this.previousContractAddress);
      this.networkFile.contract(contractName).address.should.eq(this.previousContractAddress);
    });

    it('should link dependencies', async function() {
      const app = await App.fetch(this.networkFile.appAddress);
      (await app.getPackage(dependencyName)).package.address.should.eq(this.previousDependencyAddress);
    });
  });

  describe('publishing with modified contracts', async function() {
    beforeEach('publishing', async function() {
      const contractData = this.networkFile.contract(contractName);
      this.networkFile.setContract(contractName, {
        ...contractData,
        bytecodeHash: '0xabcdef',
      });
      await publish({ network, txParams, networkFile: this.networkFile });
    });

    it('should not redeploy modified contract on app', async function() {
      const app = await App.fetch(this.networkFile.appAddress);
      const newImplFromApp = await app.getImplementation(projectName, contractName);
      const newImplFromFile = this.networkFile.contract(contractName).address;

      newImplFromApp.should.eq(newImplFromFile);
      newImplFromApp.should.eq(this.previousContractAddress);
    });
  });

  describe('publishing with proxies', async function() {
    context('for implementation proxy', function() {
      it('should be owned by proxyAdmin', async function() {
        this.ownProxy = await create({
          contractName: 'ImplV1',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await publish({ network, txParams, networkFile: this.networkFile });
        (await Proxy.at(this.ownProxy.address).admin()).should.eq(this.networkFile.proxyAdminAddress);
      });
    });

    context('for dependency proxy', function() {
      it('should be owned by proxyAdmin', async function() {
        this.dependencyProxy = await create({
          packageName: 'mock-stdlib-undeployed',
          contractName: 'GreeterImpl',
          network,
          txParams,
          networkFile: this.networkFile,
        });
        await publish({ network, txParams, networkFile: this.networkFile });
        (await Proxy.at(this.dependencyProxy.address).admin()).should.eq(this.networkFile.proxyAdminAddress);
      });
    });
  });
});
