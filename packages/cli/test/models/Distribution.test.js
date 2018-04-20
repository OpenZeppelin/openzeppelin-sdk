import Distribution from '../../src/models/Distribution'
import assertRevert from 'zos-lib/test/helpers/assertRevert'

const ImplV1 = artifacts.require('ImplV1')
const ImplV2 = artifacts.require('ImplV2')

const should = require('chai')
  .use(require('chai-as-promised'))
  .should()

contract.skip('Distribution', function ([_, owner]) {
  
  const contractName = 'Impl'
  const initialVersion = "1.0"
  const newVersion = "2.0"

  function shouldInitialize() {
    it('instantiates the distribution', async function() {
      this.distribution.address().should.not.be.null
    })

    it('has the initial version', async function () {
      const hasVersion = await this.distribution.hasVersion(initialVersion)
      hasVersion.should.be.true
    })
  }


  beforeEach("deploying", async function () {
    this.distribution = new Distribution(owner)
    await this.distribution.deploy(initialVersion)
  })


  describe('deploy', function () {
    shouldInitialize()
  })


  describe('connect', function () {
    beforeEach("connecting to existing instance", async function () {
      const connectedDistribution = new Distribution(owner)
      await connectedDistribution.connect(this.distribution.address())
      this.distribution = connectedDistribution
    })

    shouldInitialize()
  })


  describe('newVersion', function () {
    beforeEach('creating a new version', async function() {
      await this.distribution.newVersion(newVersion)
    })

    it('registers new version on distribution', async function () {
      const hasVersion = await this.distribution.hasVersion(newVersion)
      hasVersion.should.be.true
    })

    it('keeps the initial version', async function () {
      const hasVersion = await this.distribution.hasVersion(initialVersion)
      hasVersion.should.be.true
    })
  })


  describe('freeze', function() {
    it('should not be frozen by default', async function () {
      const frozen = await this.distribution.frozen(initialVersion)
      frozen.should.be.false
    })

    it('should be freezable', async function () {
      await this.distribution.freeze(initialVersion)
      const frozen = await this.distribution.frozen(initialVersion)
      frozen.should.be.true
    })
  })


  describe('get and set implementation', function () {

    describe('while unfrozen', async function() {
      beforeEach('setting implementation', async function() {
        this.implementation = await this.distribution.setImplementation(initialVersion, ImplV1, contractName)
      })

      it('should return implementation', async function () {
        const implementation = await this.distribution.getImplementation(initialVersion, contractName)
        implementation.should.be.not.null
      })

      it('should register implementation on release version', async function () {
        const implementation = await this.distribution.getImplementation(initialVersion, contractName)
        implementation.should.eq(this.implementation.address)
      })
      
    })

    describe('while frozen', function() {
      beforeEach('freezing', async function() {
        await this.distribution.freeze(initialVersion)
      })

      it('should revert when registering an implementation', async function() {
        await assertRevert(this.distribution.setImplementation(initialVersion, ImplV1, contractName))
      })
    })

  })


})
