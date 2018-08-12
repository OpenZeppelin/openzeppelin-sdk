'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts'

const DummyImplementationV2 = Contracts.getFromLocal('DummyImplementationV2')

export default function shouldBehaveLikeImplementationDirectory(directoryClass, accounts, { onDeployed } = {}) {
  const [_, owner] = accounts
  const txParams = { from: owner }

  describe('deployLocal', function () {
    const contractName = 'DummyImplementation'
    const contracts = [{ alias: contractName, name: contractName }]
    
    beforeEach('deploying implementation directory', async function () {
      this.directory = await directoryClass.deployLocal(contracts, txParams)
    })

    shouldBeDeployed(contractName)
    if (onDeployed) onDeployed()
  })

  describe('deployDependency', function () {
    const contractName = 'Greeter'
    const contracts = [{ alias: contractName, name: contractName }]
    
    beforeEach('deploying implementation directory', async function () {
      this.directory = await directoryClass.deployDependency('mock-dependency', contracts, txParams)
    })

    shouldBeDeployed(contractName)
    if (onDeployed) onDeployed()
  })

  function shouldBeDeployed(expectedContractName) {
    it('has an address', async function () {
      (await this.directory.address).should.not.be.null
    })

    it('has an owner', async function () {
      (await this.directory.owner()).should.be.equal(owner)
    })

    it('includes the given contracts', async function () {
      (await this.directory.getImplementation(expectedContractName)).should.not.be.zero
    })

    it('can set new implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)

      const currentImplementation = await this.directory.getImplementation('DummyImplementation');
      currentImplementation.should.be.eq(implementation.address)
    })

    it('can unset implementations', async function () {
      const implementation = await DummyImplementationV2.new()
      await this.directory.setImplementation('DummyImplementation', implementation.address)
      await this.directory.unsetImplementation('DummyImplementation')

      const currentImplementation = await this.directory.getImplementation('DummyImplementation')
      currentImplementation.should.be.zeroAddress
    }) 
  }
}
