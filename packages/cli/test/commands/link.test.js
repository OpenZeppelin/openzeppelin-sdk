'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

contract('link command', function() {

  stubCommands()

  itShouldParse('should call link script with a list of libs and no install', 'link', 'zos link mock-stdlib@1.1.0 mock-stdlib2@1.2.0 --no-install', function(link) {
    const libs = ['mock-stdlib@1.1.0', 'mock-stdlib2@1.2.0']
    link.should.have.been.calledWithExactly({ libs, installLibs: false })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos link mock-stdlib@1.1.0 mock-stdlib2@1.2.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ deployLibs: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
