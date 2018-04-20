import Distribution from '../../src/models/Distribution'

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
      await connectedDistribution.connect(this.distribution.address)
      this.distribution = connectedDistribution
    })

    shouldInitialize()
  })


  const createVersion = async function () {
    await this.distribution.newVersion(newVersion)
  }

  describe('newVersion', function () {
    beforeEach('creating a new version', createVersion)

    it('updates own properties', async function () {
      this.distribution.version.should.eq(newVersion)
      this.distribution.directories.should.include.key(newVersion)
    })

    it('registers new version on package', async function () {
      (await this.distribution.package.hasVersion(newVersion)).should.be.true
    })

    it('returns the current directory', async function () {
      const currentDirectory = await this.distribution.package.getVersion(newVersion)
      this.distribution.getCurrentDirectory().address.should.eq(currentDirectory)
    })
  })


  const setImplementation = async function () {
    this.implementation = await this.distribution.setImplementation(ImplV1, contractName)
  }

  describe('setImplementation', function () {
    beforeEach('setting implementation', setImplementation)

    it('should return implementation', async function () {
      this.implementation.address.should.be.not.null
    })

    it('should register implementation on directory', async function () {
      const implementation = await this.distribution.getCurrentDirectory().getImplementation(contractName)
      implementation.should.eq(this.implementation.address)
    })
  })

})
