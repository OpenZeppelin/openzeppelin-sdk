'use strict'
require('../../setup')

import AppProject from '../../../src/project/AppProject'
import shouldBehaveLikeProject from './Project.behavior';

contract('AppProject', function (accounts) {
  const [_, owner] = accounts
  const name = 'MyProject'
  const version = '0.2.0'
  const newVersion = '0.3.0'

  const deploy = async function () {
    this.project = await AppProject.deploy(name, version, { from: owner })
  }

  const fetch = async function () {
    const app = this.project.getApp()
    this.project = await AppProject.fetch(app.address, name, { from: owner })
  }

  const onInitialize = function () {
    it('has a name', async function () {
      this.project.name.should.eq(name)
    })
  }

  const onNewVersion = function () {
    it('registers the new package version in the app', async function () {
      const app = this.project.getApp()
      const thepackage = await this.project.getProjectPackage()
      const packageInfo = await app.getPackage(name)
      packageInfo.version.should.eq(newVersion)
      packageInfo.package.should.eq(thepackage.address)
    })
  }

  shouldBehaveLikeProject(deploy, fetch, onNewVersion)
})