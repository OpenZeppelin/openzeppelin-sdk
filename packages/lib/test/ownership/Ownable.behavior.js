const assertRevert = require('../helpers/assertRevert')

function shouldBehaveLikeOwnable(owner, anotherAccount) {
  describe('owner', function () {
    it('sets the creator as the owner of the contract', async function () {
      const contractOwner = await this.ownable.owner()
      assert.equal(contractOwner, owner)
    })
  })

  describe('transferOwnership', function () {
    describe('when the proposed owner is not the zero address', function () {
      const newOwner = anotherAccount

      describe('when the sender is the owner', function () {
        const from = owner

        it('transfers the ownership', async function () {
          await this.ownable.transferOwnership(newOwner, { from })

          const contractOwner = await this.ownable.owner()
          assert.equal(contractOwner, anotherAccount)
        })

        it('emits an event', async function () {
          const { logs } = await this.ownable.transferOwnership(newOwner, { from })

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'OwnershipTransferred')
          assert.equal(logs[0].args.previousOwner, owner)
          assert.equal(logs[0].args.newOwner, newOwner)
        })
      })

      describe('when the sender is not the owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await assertRevert(this.ownable.transferOwnership(newOwner, { from }))
        })
      })
    })

    describe('when the new proposed owner is the zero address', function () {
      const newOwner = 0x0

      it('reverts', async function () {
        await assertRevert(this.ownable.transferOwnership(newOwner, { from: owner }))
      })
    })
  })
}

module.exports = shouldBehaveLikeOwnable
