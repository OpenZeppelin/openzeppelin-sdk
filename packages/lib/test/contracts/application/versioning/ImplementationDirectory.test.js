'use strict';
require('../../../setup')

import Contracts from '../../../../src/utils/Contracts'
import shouldBehaveLikeImplementationDirectory from '../../../../src/test/behaviors/ImplementationDirectory'

const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')
const DummyImplementation = Contracts.getFromLocal('DummyImplementation')

contract('ImplementationDirectory', function([_, owner, anotherAddress]) {
  beforeEach(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
    this.directory = await ImplementationDirectory.new({ from: owner })
  })

  shouldBehaveLikeImplementationDirectory(owner, anotherAddress)
})
