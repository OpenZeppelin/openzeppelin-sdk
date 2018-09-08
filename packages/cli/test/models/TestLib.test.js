'use strict'
require('../setup')

import { Contracts } from 'zos-lib'
import { TestLib } from '../../src/models/Test'
import ZosPackageFile from "../../src/models/files/ZosPackageFile"

const ImplV1 = Contracts.getFromLocal('ImplV1')
const AnotherImpl = Contracts.getFromLocal('AnotherImplV1')

contract('TestLib', function ([_, owner]) {
  const txParams = { from: owner }
  const projectName = 'Herbs'
  const initialVersion = "1.1.0"

  beforeEach(async function () {
    this.packageFile = new ZosPackageFile('test/mocks/packages/package-lib-with-contracts.zos.json')
    this.networkFile = this.packageFile.networkFile('test')
    this.lib = await TestLib(txParams, this.networkFile)
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
    const anotherImpl = await this.directory.getImplementation('AnotherImpl')

    impl.should.not.be.null
    anotherImpl.should.not.be.null
  })

  it('retrieves mocks from directory', async function() {
    const impl = await this.directory.getImplementation('Impl')
    const anotherImpl = await this.directory.getImplementation('AnotherImpl')
    const implContract = ImplV1.at(impl)
    const anotherImplContract = AnotherImpl.at(anotherImpl)
    const implSay = await implContract.say()
    const anotherImplSay = await anotherImplContract.say()

    implSay.should.eq('V1')
    anotherImplSay.should.eq('AnotherV1')
  })
})
