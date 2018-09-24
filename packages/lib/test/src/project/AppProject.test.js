'use strict'
require('../../setup')

import AppProject from '../../../src/project/AppProject'
import shouldBehaveLikePackageProject from './PackageProject.behavior';
import shouldManageProxies from './ProxyProject.behaviour';
import Contracts from '../../../src/utils/Contracts';

const ImplV1 = Contracts.getFromLocal('DummyImplementation');
const ImplV2 = Contracts.getFromLocal('DummyImplementationV2');

contract('AppProject', function (accounts) {
  const [_, owner, another] = accounts
  const name = 'MyProject'
  const version = '0.2.0'
  const newVersion = '0.3.0'

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
        packageInfo.version.should.eq(newVersion)
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
})
