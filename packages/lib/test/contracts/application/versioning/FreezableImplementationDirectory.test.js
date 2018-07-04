'use strict';
require('../../../setup')

import Contracts from '../../../../src/utils/Contracts'
import assertRevert from '../../../../src/test/helpers/assertRevert'
import shouldBehaveLikeImplementationDirectory from '../../../../src/test/behaviors/ImplementationDirectory'

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const FreezableImplementationDirectory = Contracts.getFromLocal('FreezableImplementationDirectory')

contract('FreezableImplementationDirectory', ([_, owner, anotherAddress]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.directory = await FreezableImplementationDirectory.new({ from: owner })
  })

  it('starts unfrozen', async function () {
    const frozen = await this.directory.frozen()
    frozen.should.be.false
  })

  describe('freeze', function () {
    describe('when the sender is not the owner', function () {
      const from  = owner

      describe('when it is not frozen', function () {
        it('can be frozen', async function () {
          await this.directory.freeze({ from })
          const frozen = await this.directory.frozen()
          frozen.should.be.true
        })
      })

      describe('when it is frozen', function () {
        beforeEach(async function () {
          await this.directory.freeze({ from })
        })

        it('cannot be re-frozen', async function () {
          await assertRevert(this.directory.freeze({ from }))
        })
      })
    })

    describe('when the sender is not the owner', function () {
      const from = anotherAddress

      it('reverts', async function () {
        await assertRevert(this.directory.freeze({ from }))
      })
    })
  })

  describe('set/unset implementation', function () {
    describe('when it is not frozen', function () {
      shouldBehaveLikeImplementationDirectory(owner, anotherAddress)
    })

    describe('when it is frozen', function () {
      beforeEach(async function () {
        await this.directory.freeze({ from: owner })
      })

      it('does not allow to set implementation', async function () {
        await assertRevert(this.directory.setImplementation('ERC721', this.implementation_v1, { from: owner }))
      })

      it('does not allow to unset implementation', async function () {
        await assertRevert(this.directory.unsetImplementation('ERC721', { from: owner }))
      })
    })
  })
})
