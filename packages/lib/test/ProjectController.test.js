'use strict'

const encodeCall = require('./helpers/encodeCall')
const decodeLogs = require('./helpers/decodeLogs')
const assertRevert = require('./helpers/assertRevert')
const Registry = artifacts.require('Registry')
const ProjectController = artifacts.require('ProjectController')
const InitializableMock = artifacts.require('InitializableMock')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const ImplementationProviderMock = artifacts.require('ImplementationProviderMock')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('ProjectController', ([_, anAddress, owner, anotherAccount, implementation_v0, implementation_v1]) => {
  const version_0 = 'version_0'
  const version_1 = 'version_1'
  const projectName = 'my project'
  const contractName = 'ERC721'

  beforeEach(async function () {
    this.registry = await Registry.new()
    this.factory = await UpgradeabilityProxyFactory.new()
    this.fallbackProvider = await ImplementationProviderMock.new(anAddress)
    this.controller = await ProjectController.new(projectName, this.registry.address, this.factory.address, this.fallbackProvider.address, { from: owner })
  })

  it('a registry, factory and project name must be provided', async function () {
    await assertRevert(ProjectController.new(projectName, 0x0, this.factory.address, this.fallbackProvider.address))
    await assertRevert(ProjectController.new(projectName, this.registry.address, 0x0, this.fallbackProvider.address))
    await assertRevert(ProjectController.new("", this.registry.address, this.factory.address, this.fallbackProvider.address))
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

  describe('fallbackProvider', function () {
    it('returns the fallback provider being used by the controller', async function () {
      const fallbackProvider = await this.controller.fallbackProvider()

      assert.equal(fallbackProvider, this.fallbackProvider.address)
    })
  })

  describe('create', function () {
    describe('when the given version was registered', function () {
      beforeEach(async function () {
        await this.registry.addImplementation(version_0, contractName, implementation_v0)

        const { receipt } = await this.controller.create(projectName, version_0, contractName)
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
        await assertRevert(this.controller.create(projectName, version_0, contractName))
      })
    })
  })

  describe('createAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      this.behavior = await InitializableMock.new()
    })

    describe('when the given version was registered', function () {
      beforeEach(async function () {
        await this.registry.addImplementation(version_0, contractName, this.behavior.address)

        const { receipt } = await this.controller.createAndCall(projectName, version_0, contractName, initializeData, { value })
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

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        assert(balance.eq(value))
      })
    })

    describe('when the given version was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.controller.createAndCall(projectName, version_0, contractName, initializeData, { value }))
      })
    })
  })

  describe('upgradeTo', function () {
    beforeEach(async function () {
      await this.registry.addImplementation(version_0, contractName, implementation_v0)
      const { receipt } = await this.controller.create(projectName, version_0, contractName)
      this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
    })

    describe('when the sender is the controller owner', function () {
      const from = owner

      describe('when the given version was registered', function () {
        beforeEach(async function () {
          await this.registry.addImplementation(version_1, contractName, implementation_v1)
        })

        it('upgrades to the requested implementation', async function () {
          await this.controller.upgradeTo(this.proxyAddress, projectName, version_1, contractName, { from })

          const implementation = await this.proxy.implementation()
          assert.equal(implementation, implementation_v1)
        })
      })

      describe('when the given version was not registered', function () {
        it('reverts', async function () {
          await assertRevert(this.controller.upgradeTo(this.proxyAddress, projectName, version_1, contractName, { from }))
        })
      })
    })

    describe('when the sender is not the controller owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.registry.addImplementation(version_1, contractName, implementation_v1)
        await assertRevert(this.controller.upgradeTo(this.proxyAddress, projectName, version_1, contractName, { from }))
      })
    })
  })

  describe('upgradeToAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      await this.registry.addImplementation(version_0, contractName, implementation_v0)
      const { receipt } = await this.controller.create(projectName, version_0, contractName)
      this.logs = decodeLogs([receipt.logs[0]], UpgradeabilityProxyFactory, this.factory.address);
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
      this.behavior = await InitializableMock.new()
    })

    describe('when the sender is the owner', function () {
      const from = owner
      const value = 1e5

      describe('when the given version was registered', function () {
        beforeEach(async function () {
          await this.registry.addImplementation(version_1, contractName, this.behavior.address)
        })

        it('upgrades to the requested implementation', async function () {
          await this.controller.upgradeToAndCall(this.proxyAddress, projectName, version_1, contractName, initializeData, { from, value })

          const implementation = await this.proxy.implementation()
          assert.equal(implementation, this.behavior.address)
        })

        it('calls the "initialize" function', async function() {
          await this.controller.upgradeToAndCall(this.proxyAddress, projectName, version_1, contractName, initializeData, { from, value })

          const initializable = InitializableMock.at(this.proxyAddress)
          const x = await initializable.x()
          assert.equal(x, 42)
        })

        it('sends given value to the delegated implementation', async function() {
          await this.controller.upgradeToAndCall(this.proxyAddress, projectName, version_1, contractName, initializeData, { from, value })

          const balance = await web3.eth.getBalance(this.proxyAddress)
          assert(balance.eq(value))
        })
      })

      describe('when the given version was not registered', function () {
        it('reverts', async function () {
          await assertRevert(this.controller.upgradeToAndCall(this.proxyAddress, projectName, version_1, contractName, initializeData, { from, value }))
        })
      })
    })

    describe('when the sender is not the controller owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.registry.addImplementation(version_1, contractName, this.behavior.address)
        await assertRevert(this.controller.upgradeToAndCall(this.proxyAddress, projectName, version_1, contractName, initializeData, { from }))
      })
    })
  })

  describe('getImplementation', function () {
    beforeEach(async function () {
      await this.registry.addImplementation(version_0, contractName, implementation_v0)
    })

    describe('when the given distribution name is equal to the project name', function () {
      const distribution = projectName

      it('fetches the requested implementation from the registry', async function () {
        const implementation = await this.controller.getImplementation(distribution, version_0, contractName)
        assert.equal(implementation, implementation_v0);
      })
    })

    describe('when the given distribution name is not to the project name', function () {
      const distribution = 'Zeppelin'

      it('fetches the requested implementation from the fallback implementation provider', async function () {
        const fallbackProviderImplementation = await this.fallbackProvider.implementation()
        const implementation = await this.controller.getImplementation(distribution, version_0, contractName)
        assert.equal(implementation, fallbackProviderImplementation);
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
