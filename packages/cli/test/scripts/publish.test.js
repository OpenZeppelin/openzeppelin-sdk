'use strict'
require('../setup')

import { App, Package, ImplementationDirectory, Proxy } from 'zos-lib'

import publish from '../../src/scripts/publish.js';
import push from '../../src/scripts/push.js';
import create from '../../src/scripts/create.js';
import setAdmin from '../../src/scripts/set-admin.js';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';

const should = require('chai').should();

contract('publish script', function([_, owner, otherAddress]) {
  const network = 'test';
  const txParams = { from: owner };
  const defaultVersion = '1.1.0';
  const projectName = 'Herbs';
  const contractAlias = 'Impl';
  const dependencyName = 'mock-stdlib-undeployed';

  beforeEach('pushing package', async function () {
    const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-stdlib.zos.json');
    packageFile.publish = false;
    this.networkFile = packageFile.networkFile(network);

    await push({ network, txParams, networkFile: this.networkFile, deployDependencies: true });
    this.previousContractAddress = this.networkFile.contract(contractAlias).address;
    this.previousDependencyAddress = this.networkFile.getDependency(dependencyName).package;
  })

  describe('before publishing', function () {
    it('should have no package contracts', async function () {
      should.not.exist(this.networkFile.packageAddress);
      should.not.exist(this.networkFile.providerAddress);
      should.not.exist(this.networkFile.appAddress);
    })
  })

  describe('publishing an app', function () {
    beforeEach('publishing', async function () {
      await publish({ network, txParams, networkFile: this.networkFile });
    })

    it('should log contracts addresses in network file', async function () {
      this.networkFile.appAddress.should.be.nonzeroAddress;
      this.networkFile.packageAddress.should.be.nonzeroAddress;
      this.networkFile.providerAddress.should.be.nonzeroAddress;
    });

    it('should deploy contracts at logged addresses', async function () {
      const app = await App.fetch(this.networkFile.appAddress);
      (await app.getPackage(projectName)).package.address.should.eq(this.networkFile.packageAddress);

      const thepackage = await Package.fetch(this.networkFile.packageAddress);
      (await thepackage.getDirectory(defaultVersion)).address.should.eq(this.networkFile.providerAddress);

      const provider = await ImplementationDirectory.fetch(this.networkFile.providerAddress);
      (await provider.getImplementation(contractAlias)).should.be.nonzeroAddress;
    });

    it('should reuse deployed implementations', async function () {
      const provider = await ImplementationDirectory.fetch(this.networkFile.providerAddress);
      (await provider.getImplementation(contractAlias)).should.eq(this.previousContractAddress);
      this.networkFile.contract(contractAlias).address.should.eq(this.previousContractAddress);
    });

    it('should link dependencies', async function () {
      const app = await App.fetch(this.networkFile.appAddress);
      (await app.getPackage(dependencyName)).package.address.should.eq(this.previousDependencyAddress);
    });
  })

  describe('publishing with modified contracts', async function () {
    beforeEach('publishing', async function () {
      const contractData = this.networkFile.contract(contractAlias);
      this.networkFile.setContract(contractAlias, { ... contractData, bytecodeHash: '0xabcdef' })
      await publish({ network, txParams, networkFile: this.networkFile });
    })

    it('should not redeploy modified contract on app', async function () {
      const app = await App.fetch(this.networkFile.appAddress);
      const newImplFromApp = await app.getImplementation(projectName, contractAlias);
      const newImplFromFile = this.networkFile.contract(contractAlias).address;
      
      newImplFromApp.should.eq(newImplFromFile);
      newImplFromApp.should.eq(this.previousContractAddress);
    });
  });

  describe('publishing with proxies', async function () {
    it('should transfer ownership of own proxy to app', async function () {
      this.ownProxy = await create({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      await publish({ network, txParams, networkFile: this.networkFile });
      (await Proxy.at(this.ownProxy.address).admin()).should.eq(this.networkFile.appAddress);
    });

    it('should transfer ownership of dependency proxy to app', async function () {
      this.dependencyProxy = await create({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });
      await publish({ network, txParams, networkFile: this.networkFile });
      (await Proxy.at(this.dependencyProxy.address).admin()).should.eq(this.networkFile.appAddress);
    });

    it('should not transfer ownership of transferred proxy to app', async function () {
      this.transferredProxy = await create({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      await setAdmin({ newAdmin: otherAddress, contractAlias: 'Impl', packageName: 'Herbs', network, txParams, networkFile: this.networkFile })
      await publish({ network, txParams, networkFile: this.networkFile });
      (await Proxy.at(this.transferredProxy.address).admin()).should.eq(otherAddress);
    });
  });
});
