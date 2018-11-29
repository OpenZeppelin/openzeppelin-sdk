'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share'

contract('unlink command', function() {
  stubCommands()

  itShouldParse('calls unlink script with a dependency name as parameter', 'unlink', 'zos unlink mock-stdlib@1.1.0 mock-stdlib2@1.1.0', function(unlink) {
    const dependenciesNames = ['mock-stdlib@1.1.0', 'mock-stdlib2@1.1.0']
    unlink.should.have.been.calledWithExactly({ dependenciesNames })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos unlink mock-stdlib@1.1.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ deployDependencies: undefined, force: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
