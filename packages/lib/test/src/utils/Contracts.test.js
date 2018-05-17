'use strict'
require('../../setup')

import Contracts from '../../../src/utils/Contracts'

contract('Contracts', () => {
  it('can lookup contracts from the local project', async function () {
    const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
    const instance = await DummyImplementation.new()
    instance.address.should.not.be.null
  })

  it('can lookup contract from the lib project', async function () {
    const UpgradeabilityProxyFactory = Contracts.getFromLib('UpgradeabilityProxyFactory')
    const instance = await UpgradeabilityProxyFactory.new()
    instance.address.should.not.be.null
  })

  it('can lookup contracts from node modules', async function () {
    const Greeter = Contracts.getFromNodeModules('mock-dependency', 'Greeter')
    const instance = await Greeter.new()
    instance.address.should.not.be.null
  })
})
