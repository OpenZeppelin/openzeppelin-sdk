'use strict'
require('../setup')

import { Contracts } from 'zos-lib'
import { TestApp } from '../../src/models/Test'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

const ImplV1 = Contracts.getFromLocal('ImplV1')

contract('TestApp', function ([_, owner]) {
  const txParams = { from: owner }
  const projectName = 'Herbs'
  const initialVersion = "1.0.0"

  beforeEach(async function () {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-multiple-stdlibs.json')
    this.networkFile = this.packageFile.networkFile('test')
    this.app = await TestApp(txParams, this.networkFile)
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
