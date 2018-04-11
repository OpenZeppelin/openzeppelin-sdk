'use strict'

const encodeCall = require('../helpers/encodeCall')
const assertRevert = require('../helpers/assertRevert')
const InitializableMock = artifacts.require('InitializableMock')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('OwnedUpgradeabilityProxy', ([_, owner, anotherAccount, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
    const { logs } = await this.factory.createProxy(owner, implementation_v0)
    this.proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
    this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
  })

  describe('owner', function () {
    it('transfers the ownership to the requested owner', async function () {
      const proxyOwner = await this.proxy.proxyOwner()

      assert.equal(proxyOwner, owner)
    })
  })

  describe('implementation', function () {
    it('returns the current implementation address', async function () {
      const implementation = await this.proxy.implementation()

      assert.equal(implementation, implementation_v0)
    })
  })

  describe('fallback', function () {
    beforeEach(async function () {
      this.behavior = await InitializableMock.new()
      this.proxy = await OwnedUpgradeabilityProxy.new()
      this.mock = InitializableMock.at(this.proxy.address)
    })

    describe('when there is an implementation set', function () {
      it('calls the implementation', async function () {
        await this.proxy.upgradeTo(this.behavior.address)

        await this.mock.initialize(42)
        const value = await this.mock.x()

        assert.equal(value, 42)
      })
    })

    describe('when there is no implementation set', function () {
      it('reverts', async function () {
        await assertRevert(this.mock.initialize(42))
      })
    })
  })

  describe('upgradeTo', function () {
    describe('when the sender is the owner', function () {
      const from = owner

      describe('when the given implementation is different from the current one', function () {
        const newImplementation = implementation_v1

        it('upgrades to the requested implementation', async function () {
          await this.proxy.upgradeTo(newImplementation, { from })

          const implementation = await this.proxy.implementation()
          assert.equal(implementation, implementation_v1)
        })

        it('emits an event', async function () {
          const { logs } = await this.proxy.upgradeTo(newImplementation, { from })

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'Upgraded')
          assert.equal(logs[0].args.implementation, implementation_v1)
        })
      })

      describe('when the given implementation is the same as the current one', function () {
        const newImplementation = implementation_v0

        it('reverts', async function () {
          await assertRevert(this.proxy.upgradeTo(newImplementation, { from }))
        })
      })

      describe('when the given implementation is the zero address', function () {
        const newImplementation = 0x0

        it('reverts', async function () {
          await assertRevert(this.proxy.upgradeTo(newImplementation, { from }))
        })
      })
    })

    describe('when the sender is not the owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await assertRevert(this.proxy.upgradeTo(implementation_v1, { from }))
      })
    })
  })

  describe('upgradeToAndCall', function () {

    beforeEach(async function () {
      this.behavior = await InitializableMock.new()
    })

    describe('when the call does not fail', function () {
      const initializeData = encodeCall('initialize', ['uint256'], [42])

      describe('when the sender is the owner', function () {
        const from = owner
        const value = 1e5

        beforeEach(async function () {
          this.logs = (await this.proxy.upgradeToAndCall(this.behavior.address, initializeData, { from, value })).logs
        })

        it('upgrades to the requested implementation', async function () {
          const implementation = await this.proxy.implementation()
          assert.equal(implementation, this.behavior.address)
        })

        it('emits an event', async function () {
          assert.equal(this.logs.length, 1)
          assert.equal(this.logs[0].event, 'Upgraded')
          assert.equal(this.logs[0].args.implementation, this.behavior.address)
        })

        it('calls the "initialize" function', async function() {
          const initializable = InitializableMock.at(this.proxyAddress)
          const x = await initializable.x()
          assert.equal(x, 42)
        })

        it('sends given value to the delegated implementation', async function() {
          const balance = await web3.eth.getBalance(this.proxyAddress)
          assert(balance.eq(value))
        })

        it('uses the storage of the proxy', async function () {
          // fetch the x value of Initializable at position 0 of the storage
          const storedValue = await web3.eth.getStorageAt(this.proxyAddress, 1);
          assert.equal(storedValue, 42);
        })
      })

      describe('when the sender is not the owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await assertRevert(this.proxy.upgradeToAndCall(this.behavior.address, initializeData, { from }))
        })
      })
    })

    describe('when the call does fail', function () {
      const initializeData = encodeCall('fail')

      it('reverts', async function () {
        await assertRevert(this.proxy.upgradeToAndCall(this.behavior.address, initializeData, { from: owner }))
      })
    })
  })

  describe('transferOwnership', function () {
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

  describe('storage', function () {
    it('should store the implementation address in specified location', async function () {
      const position = web3.sha3("org.zeppelinos.proxy.implementation");
      const implementation = await web3.eth.getStorageAt(this.proxyAddress, position);

      assert.equal(implementation, implementation_v0);
    })

    it('should store the owner proxy in specified location', async function () {
      const position = web3.sha3("org.zeppelinos.proxy.owner");
      const proxyOwner = await web3.eth.getStorageAt(this.proxyAddress, position);

      assert.equal(proxyOwner, owner);
    })
  })
})
