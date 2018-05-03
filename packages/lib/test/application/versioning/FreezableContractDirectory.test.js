import assertRevert from '../../../src/helpers/assertRevert'
import shouldBehaveLikeContractDirectory from '../../../src/test/behaviors/ContractDirectory'

const FreezableContractDirectory = artifacts.require('FreezableContractDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('FreezableContractDirectory', ([_, owner, anotherAddress]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.directory = await FreezableContractDirectory.new({ from: owner })
  })

  it('starts unfrozen', async function () {
    const frozen = await this.directory.frozen()
    assert.isFalse(frozen)
  })

  describe('freeze', function () {
    describe('when the sender is not the owner', function () {
      const from  = owner

      describe('when it is not frozen', function () {
        it('can be frozen', async function () {
          await this.directory.freeze({ from })
          const frozen = await this.directory.frozen()
          assert.isTrue(frozen)
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

  describe('setImplementation', function () {
    describe('when it is not frozen', function () {
      shouldBehaveLikeContractDirectory(owner, anotherAddress)
    })

    describe('when it is frozen', function () {
      beforeEach(async function () {
        await this.directory.freeze({ from: owner })
      })

      it('reverts', async function () {
        await assertRevert(this.directory.setImplementation('ERC721', this.implementation_v1, { from: owner }))
      })
    })
  })
})
