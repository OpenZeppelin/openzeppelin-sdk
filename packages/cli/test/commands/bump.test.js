'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('bump command', function() {

  stubCommands()

  itShouldParse('should call bump script with version, stdlib version and no install', 'bump', 'zos bump 0.2.0 --link mock-stdlib@1.1.0 --no-install', function(bump) {
    bump.should.have.been.calledWithExactly({ version: '0.2.0', stdlibNameVersion: 'mock-stdlib@1.1.0', installLib: false })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos bump 0.2.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ deployStdlib: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
