'use strict';
require('../setup');

import { Proxy, ProxyAdmin } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import push from '../../scripts/push';
import createProxy from '../../scripts/create';
import setAdmin from '../../scripts/set-admin';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';

describe('set-admin script', function() {
  const [owner, newAdmin, anotherNewAdmin] = accounts;

  const network = 'test';
  const txParams = { from: owner };

  const assertAdmin = async function(address, expectedAdmin, networkFile) {
    const actualAdmin = await Proxy.at(address).admin();
    actualAdmin.should.eq(expectedAdmin, 'Admin property in deployed proxy does not match');

    const proxyInfo = networkFile.getProxies({}).find(p => p.address === address);
    if (!proxyInfo.admin)
      expectedAdmin.should.eq(
        networkFile.proxyAdminAddress,
        'Expected admin should be app address as proxy admin is missing',
      );
    else proxyInfo.admin.should.eq(expectedAdmin, 'Admin field in network json file does not match');
  };

  describe('on application contract', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      this.networkFile = new NetworkFile(this.projectFile, network);

      await push({ network, txParams, networkFile: this.networkFile });

      this.impl1 = await createProxy({
        contractName: 'ImplV1',
        network,
        txParams,
        networkFile: this.networkFile,
      });
      this.impl2 = await createProxy({
        contractName: 'ImplV1',
        network,
        txParams,
        networkFile: this.networkFile,
      });
      this.withLibraryImpl = await createProxy({
        contractName: 'WithLibraryImplV1',
        network,
        txParams,
        networkFile: this.networkFile,
      });
    });

    it('changes admin of a proxy given its address', async function() {
      await setAdmin({
        proxyAddress: this.impl1.address,
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertAdmin(this.impl1.address, newAdmin, this.networkFile);
      await assertAdmin(this.impl2.address, this.networkFile.proxyAdminAddress, this.networkFile);
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.proxyAdminAddress, this.networkFile);
    });

    it('changes owner of a proxy admin', async function() {
      await setAdmin({
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      const newOwner = await ProxyAdmin.fetch(this.networkFile.proxyAdmin.address).getOwner();
      newOwner.should.be.eq(newAdmin);
    });

    it('changes admin of several proxies given name', async function() {
      await setAdmin({
        contractName: 'ImplV1',
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertAdmin(this.impl1.address, newAdmin, this.networkFile);
      await assertAdmin(this.impl2.address, newAdmin, this.networkFile);
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.proxyAdminAddress, this.networkFile);
    });

    it('does not attempt to change admin of unowned proxy', async function() {
      await setAdmin({
        proxyAddress: this.impl1.address,
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      await setAdmin({
        contractName: 'ImplV1',
        newAdmin: anotherNewAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });
      await assertAdmin(this.impl1.address, newAdmin, this.networkFile);
      await assertAdmin(this.impl2.address, anotherNewAdmin, this.networkFile);
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.proxyAdminAddress, this.networkFile);
    });

    it('refuses to update all proxies given package name', async function() {
      await setAdmin({
        packageName: 'Herbs',
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      }).should.be.rejectedWith(/address or name of the contract/);
    });
  });

  describe('on dependency contract', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-undeployed-stdlib.zos.json');
      this.networkFile = new NetworkFile(this.projectFile, network);

      await push({
        network,
        txParams,
        deployDependencies: true,
        networkFile: this.networkFile,
      });

      this.greeter1 = await createProxy({
        packageName: 'mock-stdlib-undeployed',
        contractName: 'GreeterImpl',
        network,
        txParams,
        networkFile: this.networkFile,
      });
      this.greeter2 = await createProxy({
        packageName: 'mock-stdlib-undeployed',
        contractName: 'GreeterImpl',
        network,
        txParams,
        networkFile: this.networkFile,
      });
    });

    it('changes admin of a proxy given its address', async function() {
      await setAdmin({
        proxyAddress: this.greeter1.address,
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertAdmin(this.greeter1.address, newAdmin, this.networkFile);
      await assertAdmin(this.greeter2.address, this.networkFile.proxyAdminAddress, this.networkFile);
    });

    it('changes admin of several proxies given package and name', async function() {
      await setAdmin({
        packageName: 'mock-stdlib-undeployed',
        contractName: 'GreeterImpl',
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertAdmin(this.greeter1.address, newAdmin, this.networkFile);
      await assertAdmin(this.greeter2.address, newAdmin, this.networkFile);
    });

    it('changes no admins if package is missing', async function() {
      await setAdmin({
        contractName: 'GreeterImpl',
        newAdmin,
        network,
        txParams,
        networkFile: this.networkFile,
      });

      await assertAdmin(this.greeter1.address, this.networkFile.proxyAdminAddress, this.networkFile);
      await assertAdmin(this.greeter2.address, this.networkFile.proxyAdminAddress, this.networkFile);
    });
  });
});
