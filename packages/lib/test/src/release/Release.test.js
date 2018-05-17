'use strict'
require('../../setup')

import Release from '../../../src/release/Release'

contract('Release', ([_, owner]) => {
  const txParams = { from: owner }
  const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

  describe('deployLocal', function () {
    beforeEach(async function () {
      this.release = await Release.deployLocal(contracts, txParams)
    })

    it('has an owner', async function () {
      await this.release.owner().should.eventually.be.equal(owner)
    })

    it('can be frozen', async function () {
      await this.release.isFrozen().should.eventually.be.false
      await this.release.freeze().should.eventually.be.fulfilled
      await this.release.isFrozen().should.eventually.be.true
    })

    it('can tell the implementation of a contract', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })

    it('deploys a new release', async function () {
      this.release.address().should.not.be.null
      this.release.owner().should.eventually.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })
  })
})
