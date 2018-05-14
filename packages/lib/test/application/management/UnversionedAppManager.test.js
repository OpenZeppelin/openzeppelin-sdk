'use strict';

import decodeLogs from '../../../src/helpers/decodeLogs'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'

const MigratableMock = artifacts.require('MigratableMock')
const ImplementationDirectory = artifacts.require('ImplementationDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')
const UnversionedAppManager = artifacts.require('UnversionedAppManager')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('UnversionedAppManager', ([_, managerOwner, directoryOwner, anotherAccount]) => {
  const contract = 'ERC721'

  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
    this.directory = await ImplementationDirectory.new({ from: directoryOwner })
    this.manager = await UnversionedAppManager.new(this.directory.address, this.factory.address, { from: managerOwner })
  })

  it('must receive an implementation directory and a factory', async function () {
    await assertRevert(UnversionedAppManager.new(0x0, this.factory.address))
    await assertRevert(UnversionedAppManager.new(this.directory.address, 0x0))
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.manager
    })

    shouldBehaveLikeOwnable(managerOwner, anotherAccount)
  })

  describe('factory', function () {
    it('returns the proxy factory being used by the manager', async function () {
      const factory = await this.manager.factory()

      assert.equal(factory, this.factory.address)
    })
  })

  describe('create', function () {
    describe('when the requested contract was registered in the implementation provider', function () {
      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })

        const { receipt } = await this.manager.create(contract)
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.manager.getProxyImplementation(this.proxyAddress)
        assert.equal(implementation, this.implementation_v0)
      })

      it('transfers the ownership to the manager', async function () {
        const admin = await this.manager.getProxyAdmin(this.proxyAddress)
        assert.equal(admin, this.manager.address)
      })
    })

    describe('when the requested contract was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.manager.create(contract))
      })
    })
  })

  describe('createAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      this.behavior = await MigratableMock.new()
    })

    describe('when the requested contract was registered in the implementation provider', function () {
      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.behavior.address, { from: directoryOwner })

        const { receipt } = await this.manager.createAndCall(contract, initializeData, { value })
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.manager.getProxyImplementation(this.proxyAddress)
        assert.equal(implementation, this.behavior.address)
      })

      it('transfers the ownership to the manager', async function () {
        const admin = await this.manager.getProxyAdmin(this.proxyAddress)
        assert.equal(admin, this.manager.address)
      })

      it('calls "initialize" function', async function() {
        const migratable = MigratableMock.at(this.proxyAddress)
        const x = await migratable.x()
        assert.equal(x, 42)
      })

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        assert(balance.eq(value))
      })

      it('uses the storage of the proxy', async function () {
        // fetch the x value of Migratable at position 0 of the storage
        const storedValue = await web3.eth.getStorageAt(this.proxyAddress, 1)
        assert.equal(storedValue, 42)
      })
    })

    describe('when the requested contract was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.manager.createAndCall(contract, initializeData, { value }))
      })
    })
  })

  describe('upgrade', function () {
    beforeEach(async function () {
      await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      const { receipt } = await this.manager.create(contract)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy

      await this.directory.setImplementation(contract, this.implementation_v1, { from: directoryOwner })
    })

    describe('when the sender is the manager owner', function () {
      const from = managerOwner

      it('upgrades to the requested implementation', async function () {
        await this.manager.upgrade(this.proxyAddress, contract, { from })

        const implementation = await this.manager.getProxyImplementation(this.proxyAddress)
        assert.equal(implementation, this.implementation_v1)
      })
    })

    describe('when the sender is not the manager owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await assertRevert(this.manager.upgrade(this.proxyAddress, contract, { from }))
      })
    })
  })

  describe('upgradeAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      const { receipt } = await this.manager.create(contract)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.behavior = await MigratableMock.new()
    })

    describe('when the sender is the manager owner', function () {
      const from = managerOwner
      const value = 1e5

      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
        await this.manager.upgradeAndCall(this.proxyAddress, contract, initializeData, { from, value })
      })

      it('upgrades to the requested implementation', async function () {
        const implementation = await this.manager.getProxyImplementation(this.proxyAddress)
        assert.equal(implementation, this.behavior.address)
      })

      it('calls the "initialize" function', async function() {
        const migratable = MigratableMock.at(this.proxyAddress)
        const x = await migratable.x()
        assert.equal(x, 42)
      })

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        assert(balance.eq(value))
      })

      it('uses the storage of the proxy', async function () {
        // fetch the x value of Initializable at position 0 of the storage
        const storedValue = await web3.eth.getStorageAt(this.proxyAddress, 1)
        assert.equal(storedValue, 42)
      })
    })

    describe('when the sender is not the manager owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.directory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
        await assertRevert(this.manager.upgradeAndCall(this.proxyAddress, contract, initializeData, { from }))
      })
    })
  })

  describe('getImplementation', function () {

    describe('when the requested contract was registered in the directory', function () {
      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      })

      it('fetches the requested implementation from the directory', async function () {
        const implementation = await this.manager.getImplementation(contract)
        assert.equal(implementation, this.implementation_v0)
      })
    })

    describe('when the requested contract was not registered in the directory', function () {
      it('returns a zero address', async function () {
        const implementation = await this.manager.getImplementation(contract)
        assert.equal(implementation, 0x0)
      })
    })
  })
})
