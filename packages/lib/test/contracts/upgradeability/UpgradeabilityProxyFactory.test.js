'use strict';
require('../../setup')

import Proxy from '../../../src/proxy/Proxy'
import Contracts from '../../../src/utils/Contracts'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'

const InitializableMock = Contracts.getFromLocal('InitializableMock')
const AdminUpgradeabilityProxy = Contracts.getFromLocal('AdminUpgradeabilityProxy')
const UpgradeabilityProxyFactory = Contracts.getFromLocal('UpgradeabilityProxyFactory')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')

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
      implementation.should.be.equal(this.implementation_v0)
    })

    it('transfers the ownership to the requested owner', async function () {
      const admin = await this.proxy.admin({ from: owner })
      admin.should.be.equal(owner)
    })

    it('emits an event', async function () {
      this.logs.should.have.lengthOf( 1)
      this.logs[0].event.should.be.equal('ProxyCreated')
      this.logs[0].args.proxy.should.be.equal(this.proxyAddress)
    })
  })

  describe('createProxyAndCall', function () {
    const value = 1e5
    const initializeData = encodeCall('initializeWithX', ['uint256'], [42])

    context('when it fails', function () {
      beforeEach(async function () {
        this.behavior = await InitializableMock.new()
      })

      it('should revert if function reverts', async function () {
        const failFunction = encodeCall('fail')
        await assertRevert(this.factory.createProxyAndCall(owner, this.behavior.address, failFunction))
      })
    })

    context('when it succeeds', function () {

      beforeEach(async function () {
        this.behavior = await InitializableMock.new()
        const { logs } = await this.factory.createProxyAndCall(owner, this.behavior.address, initializeData, { value })
        this.logs = logs
        this.proxyAddress = logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
      })

      it('creates a proxy pointing to the requested implementation', async function () {
        const implementation = await this.proxy.implementation({ from: owner })
        implementation.should.be.equal(this.behavior.address)
      })

      it('transfers the ownership to the requested owner', async function () {
        const admin = await this.proxy.admin({ from: owner })
        admin.should.be.equal(owner)
      })

      it('emits an event', async function () {
        this.logs.should.have.lengthOf( 1)
        this.logs[0].event.should.be.equal('ProxyCreated')
        this.logs[0].args.proxy.should.be.equal(this.proxyAddress)
      })

      it('calls "initialize" function', async function() {
        const initializable = InitializableMock.at(this.proxyAddress);
        const x = await initializable.x();
        x.should.be.bignumber.eq(42);
      })

      it('sends given value to the delegated implementation', async function() {
        const balance = await web3.eth.getBalance(this.proxyAddress)
        assert(balance.eq(value))
      })

      it('uses the storage of the proxy', async function () {
        // fetch the x value of Initializable at position 0 of the storage
        const storedValue = await Proxy.at(this.proxyAddress).getStorageAt(1)
        storedValue.should.be.bignumber.eq(42);
      })
    })
  })
})
