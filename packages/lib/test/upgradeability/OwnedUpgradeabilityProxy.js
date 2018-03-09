'use strict'

const assertRevert = require('../helpers/assertRevert')
const Registry = artifacts.require('Registry')
const Factory = artifacts.require('Factory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

contract('OwnedUpgradeabilityProxy', ([owner, anotherAccount, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.registry = await Registry.new()
    this.factory = await Factory.new(this.registry.address)
    await this.registry.addVersion('0', implementation_v0)
    await this.registry.addVersion('1', implementation_v1)

    const { logs } = await this.factory.createProxy('0', { from: owner })
    const proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
    this.proxy = await OwnedUpgradeabilityProxy.at(proxyAddress)
  })

  describe('owner', function () {
    it('sets the sender as the owner', async function () {
      const proxyOwner = await this.proxy.proxyOwner()

      assert.equal(proxyOwner, owner)
    })
  })

  describe('version', function () {
    it('returns the current version', async function () {
      const version = await this.proxy.version()

      assert.equal(version, '0')
    })
  })

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      const implementation = await this.proxy.implementation()

      assert.equal(implementation, implementation_v0)
    })
  })

  describe('upgradeTo', function () {
    it('returns the new version and implementation', async function () {
      await this.proxy.upgradeTo('1')

      const version = await this.proxy.version();
      const implementation = await this.proxy.implementation()

      assert.equal(version, '1')
      assert.equal(implementation, implementation_v1)
    })

    it('emits an event', async function () {
      const { logs } = await this.proxy.upgradeTo('1')

      assert.equal(logs.length, 1)
      assert.equal(logs[0].event, 'Upgraded')
      assert.equal(logs[0].args.version, '1')
      assert.equal(logs[0].args.implementation, implementation_v1)
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
