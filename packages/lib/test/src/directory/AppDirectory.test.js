'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import AppDirectory from '../../../src/directory/AppDirectory'

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')

contract('AppDirectory', ([_, appOwner, stdlibOwner, anotherAddress]) => {
  const txParams = { from: appOwner }

  beforeEach('deploying app directory', async function () {
    this.stdlib = await ImplementationDirectory.new({ from: stdlibOwner })
    this.directory = await AppDirectory.deploy(this.stdlib.address, txParams)
  })

  it('has an address', async function () {
    (await this.directory.address).should.not.be.null
  })

  it('has an stdlib', async function () {
    (await this.directory.stdlib()).should.be.eq(this.stdlib.address)
  })

  it('has an owner', async function () {
    (await this.directory.owner()).should.be.equal(appOwner)
  })

  it('can set new implementations', async function () {
    const implementation = await DummyImplementation.new()
    await this.directory.setImplementation('DummyImplementation', implementation.address)

    const currentImplementation = await this.directory.getImplementation('DummyImplementation')
    currentImplementation.should.be.eq(implementation.address)
  })

  it('can unset implementations', async function () {
    const implementation = await DummyImplementation.new()
    await this.directory.setImplementation('DummyImplementation', implementation.address)
    await this.directory.unsetImplementation('DummyImplementation')

    const currentImplementation = await this.directory.getImplementation('DummyImplementation')
    currentImplementation.should.be.zeroAddress
  })

  it('can retrieve an implementation from the stdlib if not registered', async function () {
    let currentImplementation = await this.directory.getImplementation('DummyImplementation');
    currentImplementation.should.be.zeroAddress

    const implementation = await DummyImplementation.new()
    await this.stdlib.setImplementation('DummyImplementation', implementation.address, { from: stdlibOwner })

    currentImplementation = await this.directory.getImplementation('DummyImplementation')
    currentImplementation.should.be.eq(implementation.address)
  })

  it('can set another stdlib', async function () {
    const anotherStdlib = await ImplementationDirectory.new({ from: stdlibOwner })

    await this.directory.setStdlib(anotherStdlib.address)

    const currentStdlib = await this.directory.stdlib();
    currentStdlib.should.be.eq(anotherStdlib.address)
  })
})
