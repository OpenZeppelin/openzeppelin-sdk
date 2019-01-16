'use strict'
require('../../setup')

import AppProject from '../../../src/project/AppProject'
import shouldBehaveLikePackageProject from './PackageProject.behavior';
import shouldManageProxies from './ProxyProject.behaviour';
import Contracts from '../../../src/artifacts/Contracts';
import shouldManageDependencies from './DependenciesProject.behaviour';
import SimpleProject from '../../../src/project/SimpleProject';
import { toAddress } from '../../../src/utils/Addresses';
import { Package } from '../../../src';
import utils from 'web3-utils';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('AppProject', function (accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  
  const [_, owner, another] = accounts
  const name = 'MyProject'
  const version = '0.2.0'
  const newVersion = '0.3.0'

  describe('new AppProject', function () {
    beforeEach('deploying', async function () {
      this.project = await AppProject.fetchOrDeploy(name, version, { from: owner }, {})
      this.adminAddress = this.project.getApp().address
    });

    shouldBehaveLikePackageProject({
      fetch: async function () {
        this.appAddress = this.project.getApp().address
        this.project = await AppProject.fetchOrDeploy(name, version, { from: owner }, { appAddress: this.appAddress })
      },
      onNewVersion: function () {
        it('registers the new package version in the app', async function () {
          const app = this.project.getApp()
          const thepackage = await this.project.getProjectPackage()
          const packageInfo = await app.getPackage(name)
          packageInfo.version.map(Number).should.be.semverEqual(newVersion)
          packageInfo.package.address.should.eq(thepackage.address)
        })
      }, 
      onInitialize: function () {
        it('has a name', async function () {
          this.project.name.should.eq(name)
        })
      }
    });
    
    shouldManageProxies({
      supportsNames: true,
      otherAdmin: another,
      setImplementations: async function () {
        await this.project.setImplementation(ImplV1, "DummyImplementation")
        await this.project.setImplementation(ImplV2, "DummyImplementationV2")
      }
    })

    shouldManageDependencies();
  });

  describe('fromSimpleProject', function () {
    const name = 'myProject';
    const version = '1.4.0';
    const dependencyVersion = '1.6.0';
    const dependencyName = 'myDependency';
    const contractName = 'DummyImplementation';

    beforeEach('setting up dependency', async function () {
      this.dependency = await Package.deploy()
      await this.dependency.newVersion(dependencyVersion)
    });

    beforeEach('setting up simple project', async function () {
      this.simple = new SimpleProject(name, { from: owner });
      this.implementation = await this.simple.setImplementation(ImplV1, contractName);
      await this.simple.setDependency(dependencyName, this.dependency.address, dependencyVersion);
    });
    
    it('creates a new app project from a simple project', async function () {
      this.project = await AppProject.fromSimpleProject(this.simple);
      (await this.project.getImplementation({ contractName })).should.eq(toAddress(this.implementation));
      (await this.project.getDependencyVersion(dependencyName)).map(Number).should.be.semverEqual(dependencyVersion);
      (await this.project.getDependencyPackage(dependencyName)).address.should.be.eq(this.dependency.address);
    })
  })
})
