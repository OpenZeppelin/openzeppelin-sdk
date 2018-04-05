'use strict';

const encodeCall = require('../helpers/encodeCall')
const InitializableMock = artifacts.require('InitializableMock')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('UpgradeabilityProxyFactory', ([_, owner, implementation_v0]) => {
  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
  })

  describe('createProxy', function () {
    beforeEach(async function () {
      const { logs } = await this.factory.createProxy(owner, implementation_v0)
      this.logs = logs
      this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
    })

    it('creates a proxy pointing to the requested implementation', async function () {
      const implementation = await this.proxy.implementation()
      assert.equal(implementation, implementation_v0)
    })

    it('transfers the ownership to the requested owner', async function () {
      const proxyOwner = await this.proxy.proxyOwner()
      assert.equal(proxyOwner, owner)
    })

    it('emits an event', async function () {
      assert.equal(this.logs.length, 1)
      assert.equal(this.logs[0].event, 'ProxyCreated')
      assert.equal(this.logs[0].args.proxy, this.proxyAddress)
    })
  })

  describe('createProxyAndCall', function () {
    const initializeData = encodeCall('initialize', ['uint256'], [42])

    beforeEach(async function () {
      this.behavior = await InitializableMock.new()
      const { logs } = await this.factory.createProxyAndCall(owner, this.behavior.address, initializeData)
      this.logs = logs
      this.proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
    })

    it('creates a proxy pointing to the requested implementation', async function () {
      const implementation = await this.proxy.implementation()
      assert.equal(implementation, this.behavior.address)
    })

    it('transfers the ownership to the requested owner', async function () {
      const proxyOwner = await this.proxy.proxyOwner()
      assert.equal(proxyOwner, owner)
    })

    it('emits an event', async function () {
      assert.equal(this.logs.length, 1)
      assert.equal(this.logs[0].event, 'ProxyCreated')
      assert.equal(this.logs[0].args.proxy, this.proxyAddress)
    })

    it('calls "initialize" function', async function() {
      const initializable = InitializableMock.at(this.proxyAddress);
      const x = await initializable.x();
      assert.equal(x, 42);
    })
  })
})
