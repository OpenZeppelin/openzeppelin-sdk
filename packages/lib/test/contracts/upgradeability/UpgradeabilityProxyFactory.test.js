'use strict';

import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/helpers/assertRevert'

const MigratableMock = artifacts.require('MigratableMock')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('UpgradeabilityProxyFactory', ([_, owner]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
  })

  describe('createProxy', function () {
    beforeEach(async function () {
      const { logs } = await this.factory.createProxy(owner, this.implementation_v0)
      this.logs = logs
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
    })

    it('creates a proxy pointing to the requested implementation', async function () {
      const implementation = await this.proxy.implementation({ from: owner })
      assert.equal(implementation, this.implementation_v0)
    })

    it('transfers the ownership to the requested owner', async function () {
      const admin = await this.proxy.admin({ from: owner })
      assert.equal(admin, owner)
    })

    it('emits an event', async function () {
      assert.equal(this.logs.length, 1)
      assert.equal(this.logs[0].event, 'ProxyCreated')
      assert.equal(this.logs[0].args.proxy, this.proxyAddress)
    })
  })

  describe('createProxyAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    context('when it fails', function () {
      beforeEach(async function () {
        this.behavior = await MigratableMock.new()
      })

      it('should revert if function reverts', async function () {
        const failFunction = encodeCall('fail')
        await assertRevert(this.factory.createProxyAndCall(owner, this.behavior.address, failFunction))
      })
    })

    context('when it succeeds', function () {

      beforeEach(async function () {
        this.behavior = await MigratableMock.new()
        const { logs } = await this.factory.createProxyAndCall(owner, this.behavior.address, initializeData, { value })
        this.logs = logs
        this.proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.proxy.implementation({ from: owner })
        assert.equal(implementation, this.behavior.address)
      })

      it('transfers the ownership to the requested owner', async function () {
        const admin = await this.proxy.admin({ from: owner })
        assert.equal(admin, owner)
      })

      it('emits an event', async function () {
        assert.equal(this.logs.length, 1)
        assert.equal(this.logs[0].event, 'ProxyCreated')
        assert.equal(this.logs[0].args.proxy, this.proxyAddress)
      })

      it('calls "initialize" function', async function() {
        const migratable = MigratableMock.at(this.proxyAddress);
        const x = await migratable.x();
        assert.equal(x, 42);
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
  })
})
