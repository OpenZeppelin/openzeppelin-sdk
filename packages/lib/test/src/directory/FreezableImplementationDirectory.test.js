'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts'
import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory'

const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')

contract('FreezableImplementationDirectory', ([_, owner]) => {
  const txParams = { from: owner }

  describe('deployLocal', function () {
    const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

    beforeEach('deploying freezable implementation directory', async function () {
      this.directory = await FreezableImplementationDirectory.deployLocal(contracts, txParams)
    })

    it('has an address', async function () {
      (await this.directory.address).should.not.be.null
    })

    it('has an owner', async function () {
      (await this.directory.owner()).should.be.equal(owner)
    })

    it('can be frozen', async function () {
      let frozen = await this.directory.isFrozen();
      frozen.should.be.false

      await this.directory.freeze().should.eventually.be.fulfilled

      frozen = await this.directory.isFrozen()
      frozen.should.be.true
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

    beforeEach('deploying freezable implementation directory', async function () {
      this.directory = await FreezableImplementationDirectory.deployDependency('mock-dependency', contracts, txParams)
    })
    
    it('has an address', async function () {
      (await this.directory.address).should.not.be.null
    })

    it('has an owner', async function () {
      (await this.directory.owner()).should.be.equal(owner)
    })

    it('can be frozen', async function () {
      let frozen = await this.directory.isFrozen();
      frozen.should.be.false

      await this.directory.freeze().should.eventually.be.fulfilled

      frozen = await this.directory.isFrozen()
      frozen.should.be.true
    })

    it('includes the given contracts', async function () {
      (await this.directory.getImplementation('Greeter')).should.not.be.zero
    })

    it('can set new implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)

      const currentImplementation = await this.directory.getImplementation('DummyImplementation')
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
