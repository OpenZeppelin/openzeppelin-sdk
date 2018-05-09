import DistributionDeployer from '../../src/distribution/DistributionDeployer';
import DistributionProvider from '../../src/distribution/DistributionProvider';
import assertRevert from '../../src/helpers/assertRevert';


const DummyImplementation = artifacts.require('DummyImplementation')

const should = require('chai')
  .should()

contract('Distribution', function ([_, owner]) {
  const txParams = { from: owner }
  const contractName = 'DummyImplementation'
  const initialVersion = "1.0"
  const newVersion = "2.0"

  function shouldInitialize() {
    it('instantiates the distribution', async function() {
      this.distribution.address().should.not.be.null
    })
  }

  async function createRelease() {
    await this.distribution.newVersion(initialVersion)
  }


  beforeEach("deploying", async function () {
    this.distribution = await DistributionDeployer.call(txParams)
  })


  describe('deploy', function () {
    shouldInitialize()
  })


  describe('connect', function () {
    beforeEach("connecting to existing instance", async function () {
      const connectedDistribution = await DistributionProvider.from(this.distribution.address(), txParams)
      this.distribution = connectedDistribution
    })

    shouldInitialize()
  })


  describe('newVersion', function () {
    beforeEach('creating a new release', createRelease)

    it('registers new version on distribution', async function () {
      await this.distribution.newVersion(newVersion)
      const hasVersion = await this.distribution.hasVersion(newVersion)
      hasVersion.should.be.true
    })
  })


  describe('freeze', function() {
    beforeEach('creating a new release', createRelease)

    it('should not be frozen by default', async function () {
      const frozen = await this.distribution.isFrozen(initialVersion)
      frozen.should.be.false
    })

    it('should be freezable', async function () {
      await this.distribution.freeze(initialVersion)
      const frozen = await this.distribution.isFrozen(initialVersion)
      frozen.should.be.true
    })
  })


  describe('get and set implementation', function () {
    beforeEach('creating a new release', createRelease)

    describe('while unfrozen', async function() {
      beforeEach('setting implementation', async function() {
        this.implementation = await this.distribution.setImplementation(initialVersion, DummyImplementation, contractName)
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
        await assertRevert(this.distribution.setImplementation(initialVersion, DummyImplementation, contractName))
      })
    })

  })


})
