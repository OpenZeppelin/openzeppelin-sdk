'use strict'
require('../../setup')

import UpgradeabilityProxyFactory from '../../../src/factory/UpgradeabilityProxyFactory';

contract('UpgradeabilityProxyFactory', function ([_, owner]) {

  const txParams = { from: owner }

  beforeEach('deploying', async function () {
    this.factory = await UpgradeabilityProxyFactory.deploy(txParams)
  })

  describe('deploy', function () {
    shouldInitialize()
  })

  describe('fetch', function () {
    beforeEach('fetching', async function () {
      const address = this.factory.address
      this.factory = await UpgradeabilityProxyFactory.fetch(address, txParams)
    })

    shouldInitialize()
  })

  function shouldInitialize() {
    it('initializes the factory', async function () {
      this.factory.contract.should.be.not.null
      this.factory.address.should.be.nonzeroAddress
    })
  }

})