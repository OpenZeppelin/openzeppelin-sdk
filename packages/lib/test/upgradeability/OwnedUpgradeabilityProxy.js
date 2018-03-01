const assertRevert = require('../helpers/assertRevert')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

contract('OwnedUpgradeabilityProxy', ([owner, anotherAccount, aContract]) => {
  beforeEach(async function () {
    this.proxy = await OwnedUpgradeabilityProxy.new({ from: owner })
  })

  describe('owner', function () {
    it('has an owner', async function () {
      const proxyOwner = await this.proxy.proxyOwner()

      assert.equal(proxyOwner, owner)
    })
  })

  describe('upgradeTo', function () {
    it('returns the new version and implementation', async function () {
      await this.proxy.upgradeTo('0', aContract)

      const version = await this.proxy.version();
      const implementation = await this.proxy.implementation()

      assert.equal(version, '0');
      assert.equal(implementation, aContract)
    })

    it('emits an event', async function () {
      const { logs } = await this.proxy.upgradeTo('0', aContract)

      assert.equal(logs.length, 1)
      assert.equal(logs[0].event, 'Upgraded')
      assert.equal(logs[0].args.version, '0')
      assert.equal(logs[0].args.implementation, aContract)
    })
  })

  describe('transfer ownership', function () {
    describe('when the new proposed owner is not the zero address', function () {
      const newOwner = anotherAccount

      describe('when the sender is the owner', function () {
        const from = owner

        it('transfers the ownership', async function () {
          await this.proxy.transferProxyOwnership(newOwner, { from })

          const proxyOwner = await this.proxy.proxyOwner()
          assert.equal(proxyOwner, anotherAccount)
        })

        it('emits an event', async function () {
          const { logs } = await this.proxy.transferProxyOwnership(newOwner, { from })

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'ProxyOwnershipTransferred')
          assert.equal(logs[0].args.previousOwner, owner)
          assert.equal(logs[0].args.newOwner, newOwner)
        })
      })

      describe('when the sender is not the owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await assertRevert(this.proxy.transferProxyOwnership(newOwner, { from }))
        })
      })
    })

    describe('when the new proposed owner is the zero address', function () {
      const newOwner = 0x0

      it('reverts', async function () {
        await assertRevert(this.proxy.transferProxyOwnership(newOwner, { from: owner }))
      })
    })
  })
})
