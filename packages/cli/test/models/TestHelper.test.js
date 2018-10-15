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
      this.app = await TestHelper(txParams, this.networkFile)
    })

    it('deploys all contracts', async function() {
      const { app, directory, package: thePackage } = this.app

      app.address.should.not.be.null
      directory.address.should.not.be.null
      thePackage.address.should.not.be.null
    })

    it('sets app at initial version', async function () {
      (await this.app.getCurrentVersion()).should.eq(initialVersion)
    })

    it('registers initial version in package', async function () {
      (await this.app.package.hasVersion(initialVersion)).should.be.true
    })

    it('initializes all app properties', async function () {
      const { version, name } = this.app

      version.should.eq(initialVersion)
      name.should.eq(projectName)
    })

    it('returns the current directory', async function () {
      (await this.app.getCurrentDirectory()).address.should.not.be.null
    })

    it('has dependencies deployed', async function () {
      const dep1 = await this.app.getDependencyPackage('mock-stdlib-undeployed')
      const dep2 = await this.app.getDependencyPackage('mock-stdlib-undeployed-2')

      dep1.should.not.be.null
      dep2.should.not.be.null
    })

    it('retrieves a mock from app', async function () {
      const proxy = await this.app.createProxy(ImplV1, { contractName: 'Impl' })
      const say = await proxy.say()

      say.should.eq('V1')
    })
  })

  describe('for lightweight app project', function() {
    beforeEach(async function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      this.packageFile.full = false
      this.networkFile = this.packageFile.networkFile('test')
      this.app = await TestHelper(txParams, this.networkFile)
    })

    it('retrieves a mock from app', async function () {
      const proxy = await this.app.createProxy(ImplV1, { contractName: 'Impl' })
      const say = await proxy.say()
      say.should.eq('V1')
    })
  })

  describe('for lib project', function() {
    beforeEach(async function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-lib-with-contracts.zos.json')
      this.networkFile = this.packageFile.networkFile('test')
      this.lib = await TestHelper(txParams, this.networkFile)
      this.directory = await this.lib.getCurrentDirectory()
    })

    it('deploys all contracts', async function() {
      const { directory, package: thePackage } = this.lib

      directory.address.should.not.be.null
      thePackage.address.should.not.be.null
    })

    it('sets lib at initial version', async function () {
      (await this.lib.getCurrentVersion()).should.eq(initialVersion)
    })

    it('registers initial version in package', async function () {
      (await this.lib.package.hasVersion(initialVersion)).should.be.true
      this.lib.version.should.eq(initialVersion)
    })

    it('has directory setted up', async function () {
      this.directory.address.should.not.be.null
    })

    it('retrieves contracts in directory', async function() {
      const impl = await this.directory.getImplementation('Impl')
      const withLibraryImpl = await this.directory.getImplementation('WithLibraryImpl')

      impl.should.not.be.null
      withLibraryImpl.should.not.be.null
    })

    it('retrieves mocks from directory', async function() {
      const impl = await this.directory.getImplementation('Impl')
      const withLibraryImpl = await this.directory.getImplementation('WithLibraryImpl')
      const implContract = ImplV1.at(impl)
      const withLibraryImplContract = WithLibraryImpl.at(withLibraryImpl)
      const implSay = await implContract.say()
      const withLibraryImplSay = await withLibraryImplContract.say()

      implSay.should.eq('V1')
      withLibraryImplSay.should.eq('WithLibraryV1')
    })
  })
})
