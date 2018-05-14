import ReleaseDeployer from "../../src/release/ReleaseDeployer"

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should()

contract('ReleaseDeployer', ([_, owner]) => {
  const txParams = { from: owner }
  const contracts = [{ alias: 'DummyImplementation', name: 'DummyImplementation' }]

  describe('call', function () {
    beforeEach(async function () {
      this.release = await ReleaseDeployer.call(contracts, txParams)
    })

    it('deploys a new release', async function () {
      this.release.address().should.not.be.null
      this.release.owner().should.eventually.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.release.getImplementation('DummyImplementation')).should.not.be.zero
    })
  })
})
