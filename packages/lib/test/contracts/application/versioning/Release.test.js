'use strict';
require('../../../setup')

import assertRevert from '../../../../src/test/helpers/assertRevert'
import shouldBehaveLikeImplementationDirectory from '../../../../src/test/behaviors/ImplementationDirectory'

const DummyImplementation = artifacts.require('DummyImplementation');
const Release = artifacts.require('Release');

contract('Release', ([_, developer, anotherAddress]) => {

  beforeEach("initializing a new release", async function () {
    this.release = await Release.new({ from: developer });
  });

  it('has a developer', async function () {
    const instanceDeveloper = await this.release.developer();
    instanceDeveloper.should.be.equal(developer);
  });

  it('starts unfrozen', async function () {
    const frozen = await this.release.frozen()
    assert.isFalse(frozen)
  })

  describe('freeze', function () {
    describe('when the sender is not the developer', function () {
      const from = developer

      describe('when it is not frozen', function () {
        it('can be frozen', async function () {
          await this.release.freeze({ from })
          const frozen = await this.release.frozen()
          assert.isTrue(frozen)
        })
      })

      describe('when it is frozen', function () {
        beforeEach(async function () {
          await this.release.freeze({ from })
        })

        it('cannot be re-frozen', async function () {
          await assertRevert(this.release.freeze({ from }))
        })
      })
    })

    describe('when the sender is not the developer', function () {
      const from = anotherAddress

      it('reverts', async function () {
        await assertRevert(this.release.freeze({ from }))
      })
    })
  })

  describe('setImplementation', function () {
    beforeEach(async function() {
      this.implementation_v0 = (await DummyImplementation.new()).address
      this.implementation_v1 = (await DummyImplementation.new()).address
    })

    describe('when it is not frozen', function () {
      beforeEach(function () {
        this.directory = this.release
      })

      shouldBehaveLikeImplementationDirectory(developer, anotherAddress)
    })

    describe('when it is frozen', function () {
      beforeEach(async function () {
        await this.release.freeze({ from: developer })
      })

      it('reverts', async function () {
        await assertRevert(this.release.setImplementation('ERC721', this.implementation_v1, { from: developer }))
      })
    })
  })
})
