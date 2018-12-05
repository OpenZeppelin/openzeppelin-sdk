'use strict';
require('../../setup')

import Proxy from '../../../src/proxy/Proxy'
import ZWeb3 from '../../../src/artifacts/ZWeb3'
import encodeCall from '../../../src/helpers/encodeCall'
import assertRevert from '../../../src/test/helpers/assertRevert'

const DummyImplementation = artifacts.require('DummyImplementation')

export default function shouldBehaveLikeUpgradeabilityProxy(proxyClass, proxyCreator) {

  it('cannot be initialized with a non-contract address', async function () {
    const nonContractAddress = proxyCreator
    const initializeData = ''
    await assertRevert(proxyClass.new(nonContractAddress, initializeData, { from: proxyCreator }))
  })

  before('deploy implementation', async function () {
    this.implementation = (await DummyImplementation.new()).address
  })

  const assertProxyInitialization = function ({ value, balance }) {
    it('sets the implementation address', async function () {
      const implementation = await Proxy.at(this.proxy).implementation()
      implementation.should.be.equal(this.implementation)
    })

    it('initializes the proxy', async function () {
      const dummy = new DummyImplementation(this.proxy);
      (await dummy.value()).should.be.bignumber.eq(value)
    })

    it('has expected balance', async function () {
      (await ZWeb3.getBalance(this.proxy)).should.be.bignumber.eq(balance)
    })
  }

  describe('without initialization', function () {
    const initializeData = ''

    describe('when not sending balance', function () {
      beforeEach('creating proxy', async function () {
        this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator })).address
      })

      assertProxyInitialization({ value: 0, balance: 0 })
    })

    describe('when sending some balance', function () {
      const value = 10e5

      beforeEach('creating proxy', async function () {
        this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator, value })).address
      })

      assertProxyInitialization({ value: 0, balance: value })
    })
  })

  describe('initialization without parameters', function () {

    describe('non payable', function () {
      const expectedInitializedValue = 10
      const initializeData = encodeCall('initializeNonPayable', [], [])

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: 0 })
      })

      describe('when sending some balance', function () {
        const value = 10e5

        it('reverts', async function () {
          await assertRevert(proxyClass.new(this.implementation, initializeData, { from: proxyCreator, value }))
        })
      })
    })

    describe('payable', function () {
      const expectedInitializedValue = 100
      const initializeData = encodeCall('initializePayable', [], [])

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: 0 })
      })

      describe('when sending some balance', function () {
        const value = 10e5

        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator, value })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: value })
      })
    })
  })

  describe('initialization with parameters', function () {

    describe('non payable', function () {
      const expectedInitializedValue = 10
      const initializeData = encodeCall('initializeNonPayable', ['uint256'], [expectedInitializedValue])

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: 0 })
      })

      describe('when sending some balance', function () {
        const value = 10e5

        it('reverts', async function () {
          await assertRevert(proxyClass.new(this.implementation, initializeData, { from: proxyCreator, value }))
        })
      })
    })

    describe('payable', function () {
      const expectedInitializedValue = 42
      const initializeData = encodeCall('initializePayable', ['uint256'], [expectedInitializedValue])

      describe('when not sending balance', function () {
        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: 0 })
      })

      describe('when sending some balance', function () {
        const value = 10e5

        beforeEach('creating proxy', async function () {
          this.proxy = (await proxyClass.new(this.implementation, initializeData, { from: proxyCreator, value })).address
        })

        assertProxyInitialization({ value: expectedInitializedValue, balance: value })
      })
    })
  })
}
