'use strict'

require('../setup')

import { Contracts } from 'zos-lib'
import TestHelper from '../../src/models/TestHelper'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

const ImplV1 = Contracts.getFromLocal('ImplV1')
const WithLibraryImpl = Contracts.getFromLocal('WithLibraryImplV1')

contract('TestHelper', function ([_, owner]) {
  const txParams = { from: owner }
  const projectName = 'Herbs'
  const initialVersion = "1.1.0"

  describe('for app project', function() {
    beforeEach(async function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-multiple-stdlibs.zos.json')
      this.networkFile = this.packageFile.networkFile('test')
      this.project = await TestHelper(txParams, this.networkFile)
    })

    it('deploys all contracts', async function() {
      const { app, directory, package: thePackage } = this.project

      app.address.should.not.be.null
      directory.address.should.not.be.null
      thePackage.address.should.not.be.null
    })

    it('sets app at initial version', async function () {
      (await this.project.getCurrentVersion()).should.eq(initialVersion)
    })

    it('registers initial version in package', async function () {
      (await this.project.package.hasVersion(initialVersion)).should.be.true
    })

    it('initializes all app properties', async function () {
      const { version, name } = this.project

      version.should.eq(initialVersion)
      name.should.eq(projectName)
    })

    it('returns the current directory', async function () {
      (await this.project.getCurrentDirectory()).address.should.not.be.null
    })

    it('has dependencies deployed', async function () {
      const dep1 = await this.project.getDependencyPackage('mock-stdlib-undeployed')
      const dep2 = await this.project.getDependencyPackage('mock-stdlib-undeployed-2')

      dep1.should.not.be.null
      dep2.should.not.be.null
    })

    it('retrieves a mock from app', async function () {
      const proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl' })
      const say = await proxy.say()

      say.should.eq('V1')
    })
  })

  describe('for an unpublished project', function() {
    beforeEach(async function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      this.packageFile.publish = false
      this.networkFile = this.packageFile.networkFile('test')
      this.project = await TestHelper(txParams, this.networkFile)
    })

    it('retrieves a mock from app', async function () {
      const proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl' })
      const say = await proxy.say()
      say.should.eq('V1')
    })
  })

})
