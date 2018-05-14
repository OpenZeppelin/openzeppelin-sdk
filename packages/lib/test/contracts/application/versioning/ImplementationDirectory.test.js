'use strict';

import shouldBehaveLikeImplementationDirectory from '../../../../src/test/behaviors/ImplementationDirectory'

const ImplementationDirectory = artifacts.require('ImplementationDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('ImplementationDirectory', function([_, owner, anotherAddress]) {
  beforeEach(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
    this.directory = await ImplementationDirectory.new({ from: owner })
  })

  shouldBehaveLikeImplementationDirectory(owner, anotherAddress)
})
