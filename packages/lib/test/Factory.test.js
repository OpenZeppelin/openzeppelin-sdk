'use strict';

const Registry = artifacts.require('Registry')
const Factory = artifacts.require('Factory')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const InitializableMock = artifacts.require('InitializableMock')
const assertRevert = require('./helpers/assertRevert')
const abi = require('ethereumjs-abi')

contract('Factory', ([_, owner, implementation]) => {
  beforeEach(async function () {
    this.registry = await Registry.new()
    this.factory = await Factory.new(this.registry.address)
  })

  it('sets the correct registry', async function () {
    const registry = await this.factory.registry();
    assert.equal(registry, this.registry.address);
  })

  describe('createProxy', function () {
    const version = '0'

    describe('when the requested version was not registered', function () {
      it('reverts', async function () {
        await assertRevert(this.factory.createProxy(version, { from: owner }))
      })
    })

    describe('when the requested version was already registered', function () {
      beforeEach(async function () {
        await this.registry.addVersion(version, implementation)
        const { logs } = await this.factory.createProxy(version, { from: owner })
        this.logs = logs
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
      })

      it('creates a proxy with the given registry', async function () {
        const registry = await this.proxy.registry()
        const factoryRegistry = await this.factory.registry()
        assert.equal(registry, factoryRegistry)
      })

      it('upgrades that proxy to the requested version', async function () {
        const version = await this.proxy.version()
        assert.equal(version, '0')

        const implementation = await this.proxy.implementation()
        assert.equal(implementation, implementation)
      })

      it('emits an event', async function () {
        assert.equal(this.logs.length, 1)

        assert.equal(this.logs[0].event, 'ProxyCreated')
        assert.equal(this.logs[0].args.proxy, this.proxyAddress)
      })
    })
  })
  describe('createProxyAndCall', function () {
    const version = '0'
    const value = 42;
    const type = 'uint256';
    const methodId = abi.methodID('initialize', [type]).toString('hex')
    const params = abi.rawEncode([type], [value]).toString('hex');
    const initializeData = '0x' + methodId + params;

    beforeEach(async function () {
      const behavior = await InitializableMock.new()
      await this.registry.addVersion(version, behavior.address)
      const { logs } = await this.factory.createProxyAndCall(version, initializeData, { from: owner })
      // assert proxy created correctly
      assert.equal(logs.length, 1)
      assert.equal(logs[0].event, 'ProxyCreated')

      this.proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
      this.proxy = await OwnedUpgradeabilityProxy.at(this.proxyAddress)
    })

    it('calls "initialize" function', async function() {
      const initializable = InitializableMock.at(this.proxyAddress);
      const x = await initializable.x();
      assert.equal(x, 42);
    })

    it('creates a proxy with the given registry', async function () {
      const registry = await this.proxy.registry()
      const factoryRegistry = await this.factory.registry()
      assert.equal(registry, factoryRegistry)
    })

    it('sets registry correctly', async function() {
      const initializable = InitializableMock.at(this.proxyAddress);
      const registry = await initializable.registry()
      assert.equal(registry, this.registry.address);
    })
  })

})
