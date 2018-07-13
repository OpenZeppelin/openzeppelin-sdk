'use strict';
require('../../setup')

import Proxy from '../../../src/utils/Proxy'
import Contracts from '../../../src/utils/Contracts'
import decodeLogs from '../../../src/helpers/decodeLogs'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'

const MigratableMock = Contracts.getFromLocal('MigratableMock')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const UnversionedApp = Contracts.getFromLocal('UnversionedApp')
const UpgradeabilityProxyFactory = Contracts.getFromLocal('UpgradeabilityProxyFactory')

contract('UnversionedApp', ([_, appOwner, directoryOwner, anotherAccount]) => {
  const contract = 'ERC721'

  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
    this.directory = await ImplementationDirectory.new({ from: directoryOwner })
    this.app = await UnversionedApp.new(this.directory.address, this.factory.address, { from: appOwner })
  })

  it('must receive an implementation directory and a factory', async function () {
    await assertRevert(UnversionedApp.new(0x0, this.factory.address))
    await assertRevert(UnversionedApp.new(this.directory.address, 0x0))
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.app
    })

    shouldBehaveLikeOwnable(appOwner, anotherAccount)
  })

  describe('factory', function () {
    it('returns the proxy factory being used by the app', async function () {
      const factory = await this.app.factory()

      factory.should.be.equal(this.factory.address)
    })
  })

  describe('create', function () {
    describe('when the requested contract was registered in the implementation provider', function () {
      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })

        const { receipt } = await this.app.create(contract)
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.app.getProxyImplementation(this.proxyAddress)
        implementation.should.be.equal(this.implementation_v0)
      })

      it('transfers the ownership to the app', async function () {
        const admin = await this.app.getProxyAdmin(this.proxyAddress)
        admin.should.be.equal(this.app.address)
      })
    })

    describe('when the requested contract was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.app.create(contract))
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

        const { receipt } = await this.app.createAndCall(contract, initializeData, { value })
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.app.getProxyImplementation(this.proxyAddress)
        implementation.should.be.equal(this.behavior.address)
      })

      it('transfers the ownership to the app', async function () {
        const admin = await this.app.getProxyAdmin(this.proxyAddress)
        admin.should.be.equal(this.app.address)
      })

      it('calls "initialize" function', async function() {
        const migratable = MigratableMock.at(this.proxyAddress)
        const x = await migratable.x()
        x.should.be.bignumber.eq(42)
      })

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        balance.should.be.bignumber.eq(value)
      })

      it('uses the storage of the proxy', async function () {
        // fetch the x value of Migratable at position 0 of the storage
        const storedValue = await Proxy.at(this.proxyAddress).getStorageAt(1)
        storedValue.should.be.bignumber.eq(42)
      })
    })

    describe('when the requested contract was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.app.createAndCall(contract, initializeData, { value }))
      })
    })
  })

  describe('upgrade', function () {
    beforeEach(async function () {
      await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      const { receipt } = await this.app.create(contract)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy

      await this.directory.setImplementation(contract, this.implementation_v1, { from: directoryOwner })
    })

    describe('when the sender is the app owner', function () {
      const from = appOwner

      it('upgrades to the requested implementation', async function () {
        await this.app.upgrade(this.proxyAddress, contract, { from })

        const implementation = await this.app.getProxyImplementation(this.proxyAddress)
        implementation.should.be.equal(this.implementation_v1)
      })
    })

    describe('when the sender is not the app owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await assertRevert(this.app.upgrade(this.proxyAddress, contract, { from }))
      })
    })
  })

  describe('upgradeAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      const { receipt } = await this.app.create(contract)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.behavior = await MigratableMock.new()
    })

    describe('when the sender is the app owner', function () {
      const from = appOwner
      const value = 1e5

      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
        await this.app.upgradeAndCall(this.proxyAddress, contract, initializeData, { from, value })
      })

      it('upgrades to the requested implementation', async function () {
        const implementation = await this.app.getProxyImplementation(this.proxyAddress)
        implementation.should.be.equal(this.behavior.address)
      })

      it('calls the "initialize" function', async function() {
        const migratable = MigratableMock.at(this.proxyAddress)
        const x = await migratable.x()
        x.should.be.bignumber.eq(42)
      })

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        balance.should.be.bignumber.eq(value)
      })

      it('uses the storage of the proxy', async function () {
        // fetch the x value of Initializable at position 0 of the storage
        const storedValue = await Proxy.at(this.proxyAddress).getStorageAt(1)
        storedValue.should.be.bignumber.eq(42)
      })
    })

    describe('when the sender is not the app owner', function () {
      const from = anotherAccount

      it('reverts', async function () {
        await this.directory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
        await assertRevert(this.app.upgradeAndCall(this.proxyAddress, contract, initializeData, { from }))
      })
    })
  })

  describe('getImplementation', function () {

    describe('when the requested contract was registered in the directory', function () {
      beforeEach(async function () {
        await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      })

      it('fetches the requested implementation from the directory', async function () {
        const implementation = await this.app.getImplementation(contract)
        implementation.should.be.equal(this.implementation_v0)
      })
    })

    describe('when the requested contract was not registered in the directory', function () {
      it('returns a zero address', async function () {
        const implementation = await this.app.getImplementation(contract)
        implementation.should.be.zeroAddress
      })
    })
  })

  describe('changeAdmin', function () {
    beforeEach(async function () {
      await this.directory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
      const { receipt } = await this.app.create(contract)
      this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
    })

    it('changes admin of the proxy', async function () {
      await this.app.changeProxyAdmin(this.proxyAddress, anotherAccount, { from: appOwner });
      const proxy = Proxy.at(this.proxyAddress);
      const admin = await proxy.admin();
      admin.should.be.equal(anotherAccount);
    });
  })
})
