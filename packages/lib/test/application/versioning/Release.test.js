import assertRevert from '../../../src/helpers/assertRevert'
import shouldBehaveLikeImplementationDirectory from '../../../src/test/behaviors/ImplementationDirectory'

const Release = artifacts.require('Release');

contract('Release', ([_, developer, anotherAddress, implementation_v0, implementation_v1]) => {

  beforeEach("initializing a new release", async function () {
    this.release = await Release.new({ from: developer });
  });

  it('has a developer', async function () {
    const instanceDeveloper = await this.release.developer();
    assert.equal(instanceDeveloper, developer);
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
    describe('when it is not frozen', function () {
      beforeEach(function () {
        this.directory = this.release
        this.implementation_v0 = implementation_v0
        this.implementation_v1 = implementation_v1
      })

      shouldBehaveLikeImplementationDirectory(developer, anotherAddress)
    })

    describe('when it is frozen', function () {
      beforeEach(async function () {
        await this.release.freeze({ from: developer })
      })

      it('reverts', async function () {
        await assertRevert(this.release.setImplementation('ERC721', implementation_v1, { from: developer }))
      })
    })
  })
})
