'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('link command', function() {

  stubCommands()

  itShouldParse('should call link script with lib and no install', 'link', 'zos link mock-stdlib@1.1.0 --no-install', function(link) {
    link.should.have.been.calledWithExactly({ libNameVersion: 'mock-stdlib@1.1.0', installLib: false })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos link mock-stdlib@1.1.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({ deployLibs: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
