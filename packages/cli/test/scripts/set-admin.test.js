'use strict'
require('../setup')

import { Proxy } from "zos-lib";

import push from '../../src/scripts/push.js';
import createProxy from '../../src/scripts/create.js';
import setAdmin from '../../src/scripts/set-admin.js';
import ZosPackageFile from "../../src/models/files/ZosPackageFile";

contract('set-admin script', function([_skipped, owner, newAdmin, anotherNewAdmin]) {
  const network = 'test';
  const version_1 = '1.1.0';
  const txParams = { from: owner };

  const assertAdmin = async function (address, expectedAdmin, networkFile) {
    const actualAdmin = await Proxy.at(address).admin()
    actualAdmin.should.eq(expectedAdmin, "Admin property in deployed proxy does not match")
    
    const proxyInfo = networkFile.getProxies({}).find(p => p.address === address)
    if (!proxyInfo.admin) expectedAdmin.should.eq(networkFile.appAddress, "Expected admin should be app address as proxy admin is missing")
    else proxyInfo.admin.should.eq(expectedAdmin, "Admin field in network json file does not match")
  }

  describe('on application contract', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      this.networkFile = this.packageFile.networkFile(network)
      await push({ network, txParams, networkFile: this.networkFile })

      this.impl1 = await createProxy({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      this.impl2 = await createProxy({ contractAlias: 'Impl', network, txParams, networkFile: this.networkFile });
      this.withLibraryImpl = await createProxy({ contractAlias: 'WithLibraryImpl', network, txParams, networkFile: this.networkFile });
    });

    it('changes admin of a proxy given its address', async function() {
      await setAdmin({ proxyAddress: this.impl1.address, newAdmin, network, txParams, networkFile: this.networkFile });

      await assertAdmin(this.impl1.address, newAdmin, this.networkFile)
      await assertAdmin(this.impl2.address, this.networkFile.appAddress, this.networkFile)
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.appAddress, this.networkFile)
    });

    it('changes admin of several proxies given name', async function() {
      await setAdmin({ contractAlias: 'Impl', newAdmin, network, txParams, networkFile: this.networkFile });
      
      await assertAdmin(this.impl1.address, newAdmin, this.networkFile)
      await assertAdmin(this.impl2.address, newAdmin, this.networkFile)
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.appAddress, this.networkFile)
    });

    it('does not attempt to change admin of unowned proxy', async function() {
      await setAdmin({ proxyAddress: this.impl1.address, newAdmin, network, txParams, networkFile: this.networkFile });
      await setAdmin({ contractAlias: 'Impl', newAdmin: anotherNewAdmin, network, txParams, networkFile: this.networkFile });
      await assertAdmin(this.impl1.address, newAdmin, this.networkFile)
      await assertAdmin(this.impl2.address, anotherNewAdmin, this.networkFile)
      await assertAdmin(this.withLibraryImpl.address, this.networkFile.appAddress, this.networkFile)
    });

    it('refuses to update all proxies', async function () {
      await setAdmin({ newAdmin, network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/address or name of the contract/);
    })

    it('refuses to update all proxies given package name', async function () {
      await setAdmin({ packageName: "Herbs", newAdmin, network, txParams, networkFile: this.networkFile }).should.be.rejectedWith(/address or name of the contract/);
    })
  });

  describe('on dependency contract', function () {
    beforeEach('setup', async function() {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-undeployed-stdlib.zos.json')
      this.networkFile = this.packageFile.networkFile(network)
      await push({ network, txParams, deployDependencies: true, networkFile: this.networkFile })

      this.greeter1 = await createProxy({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });
      this.greeter2 = await createProxy({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', network, txParams, networkFile: this.networkFile });
    });

    it('changes admin of a proxy given its address', async function() {
      await setAdmin({ proxyAddress: this.greeter1.address, newAdmin, network, txParams, networkFile: this.networkFile });
      
      await assertAdmin(this.greeter1.address, newAdmin, this.networkFile)
      await assertAdmin(this.greeter2.address, this.networkFile.appAddress, this.networkFile)
    });

    it('changes admin of several proxies given package and name', async function() {
      await setAdmin({ packageName: 'mock-stdlib-undeployed', contractAlias: 'Greeter', newAdmin, network, txParams, networkFile: this.networkFile });
      
      await assertAdmin(this.greeter1.address, newAdmin, this.networkFile)
      await assertAdmin(this.greeter2.address, newAdmin, this.networkFile)
    });

    it('changes no admins if package is missing', async function() {
      await setAdmin({ contractAlias: 'Greeter', newAdmin, network, txParams, networkFile: this.networkFile });
      
      await assertAdmin(this.greeter1.address, this.networkFile.appAddress, this.networkFile)
      await assertAdmin(this.greeter2.address, this.networkFile.appAddress, this.networkFile)
    });
  });
});
