'use strict'
require('../../setup')

import Release from '../../../src/release/Release'

contract('Release', ([_, owner]) => {
  const txParams = { from: owner }

  describe('deployLocal', function () {
    const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

    beforeEach(async function () {
      this.release = await Release.deployLocal(contracts, txParams)
    })

    it('has an owner', async function () {
      (await this.release.owner()).should.be.equal(owner)
    })

    it('can be frozen', async function () {
      let frozen = await this.release.isFrozen();
      frozen.should.be.false

      await this.release.freeze().should.eventually.be.fulfilled

      frozen = await this.release.isFrozen()
      frozen.should.be.true
    })

    it('can tell the implementation of a contract', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })

    it('deploys a new release', async function () {
      this.release.address().should.be.not.null;
      (await this.release.owner()).should.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })

    it('sets another implementation', async function() {
      const address = await this.release.getImplementation('DummyImplementation');
      await this.release.setImplementation('AnotherDummy', address);
      (await this.release.getImplementation('AnotherDummy')).should.eq(address);
    });

    it('unsets an implementation', async function() {
      await this.release.unsetImplementation('DummyImplementation')
      parseInt(await this.release.getImplementation('DummyImplementation')).should.be.zero
    });
  })

  describe('deployDependency', function () {
    const contracts = [{ alias: 'Greeter', name: 'Greeter' }]

    beforeEach(async function () {
      this.release = await Release.deployDependency('mock-dependency', contracts, txParams)
    })

    it('has an owner', async function () {
      (await this.release.owner()).should.be.equal(owner)
    })

    it('can be frozen', async function () {
      let frozen = await this.release.isFrozen();
      frozen.should.be.false

      await this.release.freeze().should.eventually.be.fulfilled

      frozen = await this.release.isFrozen()
      frozen.should.be.true
    })

    it('can tell the implementation of a contract', async function () {
      (await this.release.getImplementation('Greeter')).should.not.be.zero
    })

    it('deploys a new release', async function () {
      this.release.address().should.be.not.null;
      (await this.release.owner()).should.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.release.getImplementation('Greeter')).should.not.be.zero
    })
  })
})
