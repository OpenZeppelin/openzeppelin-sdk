'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('remove command', function() {
  stubCommands()

  itShouldParse('should call remove script', 'remove', 'zos remove Impl', function(remove) {
    remove.should.have.been.calledWithExactly({ contracts: ['Impl'] })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos remove Impl --push test', function(push) {
    push.should.have.been.calledWithExactly({  deployDependencies: true, force: undefined, reupload: undefined, network: 'test', txParams: {} })
  })
})
