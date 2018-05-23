'use strict'
require('../../setup')

import Package from '../../../src/package/Package';
import Contracts from '../../../src/utils/Contracts'
import assertRevert from '../../../src/test/helpers/assertRevert';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')

contract('Package', function ([_, owner]) {
  const txParams = { from: owner }
  const contractName = 'DummyImplementation'
  const initialVersion = "1.0"
  const newVersion = "2.0"

  const shouldInitialize = function () {
    it('instantiates the package', async function() {
      this.package.address().should.not.be.null
    })
  }

  const createRelease = async function () {
    await this.package.newVersion(initialVersion)
  }

  beforeEach("deploying", async function () {
    this.package = await Package.deploy(txParams)
  })

  describe('deploy', function () {
    shouldInitialize()
  })

  describe('connect', function () {
    beforeEach("connecting to existing instance", async function () {
      this.package = await Package.fetch(this.package.address(), txParams)
    })

    shouldInitialize()
  })

  describe('newVersion', function () {
    beforeEach('creating a new release', createRelease)

    it('registers new version on package', async function () {
      await this.package.newVersion(newVersion)
      const hasVersion = await this.package.hasVersion(newVersion)
      hasVersion.should.be.true
    })
  })

  describe('freeze', function() {
    beforeEach('creating a new release', createRelease)

    it('should not be frozen by default', async function () {
      const frozen = await this.package.isFrozen(initialVersion)
      frozen.should.be.false
    })

    it('should be freezable', async function () {
      await this.package.freeze(initialVersion)
      const frozen = await this.package.isFrozen(initialVersion)
      frozen.should.be.true
    })
  })

  describe('get and set implementation', function () {
    beforeEach('creating a new release', createRelease)

    describe('while unfrozen', async function() {
      beforeEach('setting implementation', async function() {
        this.implementation = await this.package.setImplementation(initialVersion, DummyImplementation, contractName)
      })

      it('should return implementation', async function () {
        const implementation = await this.package.getImplementation(initialVersion, contractName)
        implementation.should.be.not.null
      })

      it('should register implementation on release version', async function () {
        const implementation = await this.package.getImplementation(initialVersion, contractName)
        implementation.should.eq(this.implementation.address)
      })
    })

    describe('while frozen', function() {
      beforeEach('freezing', async function() {
        await this.package.freeze(initialVersion)
      })

      it('should revert when registering an implementation', async function() {
        await assertRevert(this.package.setImplementation(initialVersion, DummyImplementation, contractName))
      })
    })
  })
})
