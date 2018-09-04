'use strict'
require('../setup')

import { Contracts } from 'zos-lib'
import ProjectApp from '../../src/models/ProjectApp'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

const ImplV1 = Contracts.getFromLocal('ImplV1')

contract('ProjectApp', function ([_, owner]) {
  const txParams = { from: owner }
  const projectName = 'Herbs'
  const initialVersion = "1.0.0"

  beforeEach(async function () {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts-and-multiple-stdlibs.json')
    this.networkFile = this.packageFile.networkFile('test')
    this.project = await ProjectApp(txParams, this.networkFile)
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
    (await this.project.getCurrentDirectory()).address.should.be.not.null
  })

  it.skip('has dependencies deployed', async function () {
  })

  it('retrieves a mock from app', async function () {
    const proxy = await this.project.createProxy(ImplV1, { contractName: 'Impl' })
    const say = await proxy.say()
    say.should.eq('V1')
  })
})
