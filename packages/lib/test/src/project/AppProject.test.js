'use strict';
require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';
import ProxyAdmin from '../../../src/proxy/ProxyAdmin';
import AppProject from '../../../src/project/AppProject';
import SimpleProject from '../../../src/project/SimpleProject';
import shouldManageProxies from './ProxyProject.behaviour';
import shouldManageDependencies from './DependenciesProject.behaviour';
import shouldBehaveLikePackageProject from './PackageProject.behavior';
import shouldManageAdminProxy from './AdminProxy.behaviour';
import assertRevert from '../../../src/test/helpers/assertRevert';
import { toAddress } from '../../../src/utils/Addresses';
import { Package } from '../../../src';
import utils from 'web3-utils';
import ProxyFactory from '../../../src/proxy/ProxyFactory';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

async function setImplementations() {
  await this.project.setImplementation(ImplV1, 'DummyImplementation');
  await this.project.setImplementation(ImplV2, 'DummyImplementationV2');
}

contract('AppProject', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);

  const [_, owner, another] = accounts;
  const name = 'MyProject';
  const version = '0.2.0';
  const newVersion = '0.3.0';

  describe('new AppProject', function() {
    beforeEach('deploying', async function() {
      this.proxyAdmin = await ProxyAdmin.deploy({ from: owner });
      this.proxyFactory = await ProxyFactory.deploy({ from: owner });
      this.project = await AppProject.fetchOrDeploy(
        name,
        version,
        { from: owner },
        {
          proxyAdminAddress: this.proxyAdmin.address,
          proxyFactoryAddress: this.proxyFactory.address,
        },
      );
      this.adminAddress = this.project.proxyAdmin.address;
    });

    it('should have a proxyAdmin initialized', function() {
      this.project.proxyAdmin.should.be.an.instanceof(ProxyAdmin);
      this.project.proxyAdmin.address.should.equalIgnoreCase(
        this.proxyAdmin.address,
      );
    });

    it('should have a proxyFactory initialized', function() {
      this.project.proxyFactory.should.be.an.instanceof(ProxyFactory);
      this.project.proxyFactory.address.should.equalIgnoreCase(
        this.proxyFactory.address,
      );
    });

    describe('instance methods', function() {
      beforeEach('deploy implementations', async function() {
        this.implementation = await this.project.setImplementation(
          ImplV1,
          'DummyImplementation',
        );
        this.proxy = await this.project.createProxy(ImplV1);
      });

      describe('#upgradeProxy', function() {
        it('fails to upgrade a proxy for unregistered package', async function() {
          await assertRevert(
            this.project.upgradeProxy(this.proxy.address, ImplV1, {
              contractName: 'NOTEXISTS',
            }),
          );
        });

        it('fails to upgrade a proxy for unregistered contract', async function() {
          await assertRevert(
            this.project.upgradeProxy(this.proxy.address, ImplV1, {
              packageName: 'NOTEXISTS',
            }),
          );
        });

        it('fails to upgrade a non-proxy contract', async function() {
          await assertRevert(
            this.project.upgradeProxy(this.implementation.address, ImplV1),
          );
        });
      });
    });

    shouldBehaveLikePackageProject({
      fetch: async function() {
        this.appAddress = this.project.getApp().address;
        this.project = await AppProject.fetchOrDeploy(
          name,
          version,
          { from: owner },
          { appAddress: this.appAddress },
        );
      },
      onNewVersion: function() {
        it('registers the new package version in the app', async function() {
          const app = this.project.getApp();
          const thepackage = await this.project.getProjectPackage();
          const packageInfo = await app.getPackage(name);
          packageInfo.version.should.be.semverEqual(newVersion);
          packageInfo.package.address.should.eq(thepackage.address);
        });
      },
      onInitialize: function() {
        it('has a name', async function() {
          this.project.name.should.eq(name);
        });
      },
    });

    shouldManageProxies({
      supportsNames: true,
      otherAdmin: another,
      setImplementations,
    });

    shouldManageDependencies();
    shouldManageAdminProxy({
      otherAdmin: another,
      setImplementations,
    });
  });

  describe('fromSimpleProject', function() {
    const name = 'myProject';
    const version = '1.4.0';
    const dependencyVersion = '1.6.0';
    const dependencyName = 'myDependency';
    const contractName = 'DummyImplementation';

    beforeEach('setting up dependency', async function() {
      this.dependency = await Package.deploy();
      await this.dependency.newVersion(dependencyVersion);
    });

    beforeEach('setting up simple project', async function() {
      this.simple = new SimpleProject(name, null, { from: owner });
      this.implementation = await this.simple.setImplementation(
        ImplV1,
        contractName,
      );
      await this.simple.setDependency(
        dependencyName,
        this.dependency.address,
        dependencyVersion,
      );
    });

    it('creates a new app project from a simple project', async function() {
      this.project = await AppProject.fromSimpleProject(this.simple);
      (await this.project.getImplementation({ contractName })).should.eq(
        toAddress(this.implementation),
      );
      (await this.project.getDependencyVersion(
        dependencyName,
      )).should.be.semverEqual(dependencyVersion);
      (await this.project.getDependencyPackage(
        dependencyName,
      )).address.should.be.eq(this.dependency.address);
    });
  });
});
