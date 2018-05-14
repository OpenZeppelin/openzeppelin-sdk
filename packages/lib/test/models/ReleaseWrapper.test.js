import ReleaseDeployer from "../../src/release/ReleaseDeployer"

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should()

contract('ReleaseWrapper', ([_, owner]) => {
  const txParams = { from: owner }
  const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

  describe('call', function () {
    beforeEach(async function () {
      this.release = await ReleaseDeployer.call(contracts, txParams)
    })

    it('has an owner', async function () {
      await this.release.owner().should.eventually.be.equal(owner)
    })

    it('can be frozen', async function () {
      await this.release.isFrozen().should.eventually.be.false
      await this.release.freeze().should.eventually.be.fulfilled
      await this.release.isFrozen().should.eventually.be.true
    })

    it('can tell the implementation of a contract', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })
  })
})
