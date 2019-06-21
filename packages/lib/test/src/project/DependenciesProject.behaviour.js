'use strict';
require('../../setup');

import Proxy from '../../../src/proxy/Proxy';
import Package from '../../../src/application/Package';
import Contracts from '../../../src/artifacts/Contracts';
import PackageProject from '../../../src/project/PackageProject';
import { toAddress } from '../../../src/utils/Addresses';

const Impl = Contracts.getFromLocal('Impl');
const DummyImplementation = Contracts.getFromLocal('DummyImplementation');
const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2');

export default function shouldManageDependencies() {
  const packageName = 'MyDependency';
  const projectVersion = '1.3.0';

  describe('dependencies management', function() {
    beforeEach('setting dependency', async function() {
      this.package = await Package.deploy();
      await this.package.newVersion(projectVersion);
      await this.project.setDependency(
        packageName,
        this.package.address,
        projectVersion,
      );
    });

    it('retrieves dependency info', async function() {
      (await this.project.hasDependency(packageName)).should.be.true;
      (await this.project.getDependencyVersion(
        packageName,
      )).should.be.semverEqual(projectVersion);
      (await this.project.getDependencyPackage(packageName)).address.should.eq(
        this.package.address,
      );
    });

    it('unsets dependency', async function() {
      await this.project.unsetDependency(packageName);
      (await this.project.hasDependency(packageName)).should.be.false;
    });
  });

  describe('proxies on dependencies', async function() {
    beforeEach('setting dependency', async function() {
      this.dependency = await PackageProject.fetchOrDeploy(projectVersion);
      await this.dependency.setImplementation(DummyImplementation);
      await this.dependency.setImplementation(DummyImplementationV2);
      this.package = await this.dependency.getProjectPackage();
      await this.project.setDependency(
        packageName,
        this.package.address,
        projectVersion,
      );
    });

    describe('createProxy', function() {
      it('creates a proxy given contract and package', async function() {
        const instance = await this.project.createProxy(Impl, {
          contractName: 'DummyImplementation',
          packageName,
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
      });

      it('creates and initializes a proxy given contract and package', async function() {
        const instance = await this.project.createProxy(DummyImplementation, {
          packageName,
          initArgs: [10, 'foo', [20, 30]],
        });
        await assertIsVersion(instance, 'V1');
        await assertIsProxy(instance, this.adminAddress);
        (await instance.methods.value().call()).should.eq('10');
      });

      it('fails to create a proxy from non-existing contract in a package', async function() {
        await this.project.createProxy(DummyImplementation, {
          packageName,
          contractName: 'NotExists',
        }).should.be.rejected;
      });
    });

    describe('upgradeProxy', function() {
      beforeEach('creating proxy', async function() {
        this.instance = await this.project.createProxy(Impl, {
          contractName: 'DummyImplementation',
          packageName,
        });
      });

      it('upgrades a proxy given contract and package', async function() {
        const upgraded = await this.project.upgradeProxy(
          this.instance.address,
          Impl,
          { packageName, contractName: 'DummyImplementationV2' },
        );
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
      });

      it('upgrades and migrates a proxy', async function() {
        const upgraded = await this.project.upgradeProxy(
          this.instance.address,
          DummyImplementationV2,
          { packageName, initMethod: 'migrate', initArgs: [20] },
        );
        await assertIsVersion(upgraded, 'V2');
        await assertIsProxy(upgraded, this.adminAddress);
        (await upgraded.methods.value().call()).should.eq('20');
      });
    });
  });

  async function assertIsProxy(address, adminAddress) {
    const proxy = Proxy.at(toAddress(address));
    (await proxy.implementation()).should.be.nonzeroAddress;
    (await proxy.admin()).should.eq(adminAddress);
  }

  async function assertIsVersion(instance, expected) {
    const actual = await instance.methods.version().call();
    actual.should.eq(expected);
  }
}
