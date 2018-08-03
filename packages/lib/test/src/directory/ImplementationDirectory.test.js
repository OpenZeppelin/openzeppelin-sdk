'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import ImplementationDirectory from '../../../src/directory/ImplementationDirectory'

const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')

contract('ImplementationDirectory', ([_, owner, anotherAddress]) => {
  const txParams = { from: owner }

  describe('deployLocal', function () {
    const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

    beforeEach('deploying implementation directory', async function () {
      this.directory = await ImplementationDirectory.deployLocal(contracts, txParams)
    })

    it('has an address', async function () {
      (await this.directory.address).should.not.be.null
    })

    it('has an owner', async function () {
      (await this.directory.owner()).should.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.directory.getImplementation('DummyImplementation')).should.not.be.zero
    })

    it('can set new implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)

      const currentImplementation = await this.directory.getImplementation('DummyImplementation');
      currentImplementation.should.be.eq(implementation.address)
    })

    it('can unset implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)
      await this.directory.unsetImplementation('DummyImplementation')

      const currentImplementation = await this.directory.getImplementation('DummyImplementation')
      currentImplementation.should.be.zeroAddress
    })
  })

  describe('deployDependency', function () {
    const contracts = [{ alias: 'Greeter', name: 'Greeter' }]

    beforeEach('deploying implementation directory', async function () {
      this.directory = await ImplementationDirectory.deployDependency('mock-dependency', contracts, txParams)
    })

    it('has an address', async function () {
      (await this.directory.address).should.not.be.null
    })

    it('has an owner', async function () {
      (await this.directory.owner()).should.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.directory.getImplementation('Greeter')).should.not.be.zero
    })

    it('can set new implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)

      const currentImplementation = await this.directory.getImplementation('DummyImplementation');
      currentImplementation.should.be.eq(implementation.address)
    })

    it('can unset implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)
      await this.directory.unsetImplementation('DummyImplementation')

      const currentImplementation = await this.directory.getImplementation('DummyImplementation')
      currentImplementation.should.be.zeroAddress
    })
  })
})
