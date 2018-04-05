'use strict'

const encodeCall = require('./helpers/encodeCall')
const decodeLogs = require('./helpers/decodeLogs')
const assertRevert = require('./helpers/assertRevert')
const Registry = artifacts.require('Registry')
const ProxyController = artifacts.require('ProxyController')
const InitializableMock = artifacts.require('InitializableMock')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('ProxyController', ([_, owner, anotherAccount, implementation_v0, implementation_v1]) => {
  const version_0 = 'version_0'
  const version_1 = 'version_1'

  beforeEach(async function () {
    this.registry = await Registry.new()
    this.factory = await UpgradeabilityProxyFactory.new()
    this.controller = await ProxyController.new(this.registry.address, this.factory.address, { from: owner })
  })

  describe('owner', function () {
    it('sets the creator as the owner of the controller', async function () {
      const controllerOwner = await this.controller.owner()
      assert.equal(controllerOwner, owner)
    })
  })

  describe('factory', function () {
    it('returns the proxy factory being used by the controller', async function () {
      const factory = await this.controller.factory()

      assert.equal(factory, this.factory.address)
    })
  })

  describe('registry', function () {
    it('returns the registry being used by the controller', async function () {
      const registry = await this.controller.registry()

      assert.equal(registry, this.registry.address)
    })
  })

  describe('create', function () {
    describe('when the given version was registered', function () {
      beforeEach(async function () {
        await this.registry.addVersion(version_0, implementation_v0)

        const { receipt } = await this.controller.create(version_0)
        this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.proxy.implementation()
        assert.equal(implementation, implementation_v0)
      })

      it('transfers the ownership to the controller', async function () {
        const proxyOwner = await this.proxy.proxyOwner()
        assert.equal(proxyOwner, this.controller.address)
      })
    })

    describe('when the given version was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.controller.create(version_0))
      })
    })
  })

  describe('createAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      this.behavior = await InitializableMock.new()
    })

    describe('when the given version was registered', function () {
      beforeEach(async function () {
        await this.registry.addVersion(version_0, this.behavior.address)

        const { receipt } = await this.controller.createAndCall(version_0, initializeData)
        this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.proxy.implementation()
        assert.equal(implementation, this.behavior.address)
      })

      it('transfers the ownership to the controller', async function () {
        const proxyOwner = await this.proxy.proxyOwner()
        assert.equal(proxyOwner, this.controller.address)
      })

      it('calls "initialize" function', async function() {
        const initializable = InitializableMock.at(this.proxyAddress);
        const x = await initializable.x();
        assert.equal(x, 42);
      })
    })

    describe('when the given version was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.controller.createAndCall(version_0, initializeData))
      })
    })
  })

  describe('upgradeTo', function () {
    beforeEach(async function () {
      await this.registry.addVersion(version_0, implementation_v0)
      const { receipt } = await this.controller.create(version_0)
      this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
    })

    describe('when the sender is the controller owner', function () {
      const from = owner

      describe('when the given version was registered', function () {
        beforeEach(async function () {
          await this.registry.addVersion(version_1, implementation_v1)
        })

        it('upgrades to the requested implementation', async function () {
          await this.controller.upgradeTo(this.proxyAddress, version_1, { from })

          const implementation = await this.proxy.implementation()
          assert.equal(implementation, implementation_v1)
        })
      })

      describe('when the given version was not registered', function () {
        it('reverts', async function () {
          await assertRevert(this.controller.upgradeTo(this.proxyAddress, version_1, { from }))
        })
      })
    })

    describe('when the sender is not the controller owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.registry.addVersion(version_1, implementation_v1)
        await assertRevert(this.controller.upgradeTo(this.proxyAddress, version_1, { from }))
      })
    })
  })

  describe('upgradeToAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      await this.registry.addVersion(version_0, implementation_v0)
      const { receipt } = await this.controller.create(version_0)
      this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
      this.behavior = await InitializableMock.new()
    })

    describe('when the sender is the owner', function () {
      const from = owner

      describe('when the given version was registered', function () {
        beforeEach(async function () {
          await this.registry.addVersion(version_1, this.behavior.address)
        })

        it('upgrades to the requested implementation', async function () {
          await this.controller.upgradeToAndCall(this.proxyAddress, version_1, initializeData, { from })

          const implementation = await this.proxy.implementation()
          assert.equal(implementation, this.behavior.address)
        })

        it('calls the "initialize" function', async function() {
          await await this.controller.upgradeToAndCall(this.proxyAddress, version_1, initializeData, { from })

          const initializable = InitializableMock.at(this.proxyAddress)
          const x = await initializable.x()
          assert.equal(x, 42)
        })
      })

      describe('when the given version was not registered', function () {
        it('reverts', async function () {
          await assertRevert(this.controller.upgradeToAndCall(this.proxyAddress, version_1, initializeData, { from }))
        })
      })
    })

    describe('when the sender is not the controller owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.registry.addVersion(version_1, this.behavior.address)
        await assertRevert(this.controller.upgradeToAndCall(this.proxyAddress, version_1, initializeData, { from }))
      })
    })
  })

  describe('transferOwnership', function () {
    describe('when the proposed owner is not the zero address', function () {
      const newOwner = anotherAccount

      describe('when the sender is the owner', function () {
        const from = owner

        it('transfers the ownership', async function () {
          await this.controller.transferOwnership(newOwner, { from })

          const controllerOwner = await this.controller.owner()
          assert.equal(controllerOwner, anotherAccount)
        })
      })

      describe('when the sender is not the owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await assertRevert(this.controller.transferOwnership(newOwner, { from }))
        })
      })
    })

    describe('when the new proposed owner is the zero address', function () {
      const newOwner = 0x0

      it('reverts', async function () {
        await assertRevert(this.controller.transferOwnership(newOwner, { from: owner }))
      })
    })
  })
})
