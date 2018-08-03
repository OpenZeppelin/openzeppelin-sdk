'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('push command', function() {

  stubCommands()

  itShouldParse('should call push script with options', 'push', 'zos push --network test --skip-compile -d --reset', function(push) {
    push.should.have.been.calledWithExactly({ deployStdlib: true, reupload: true, network: 'test', txParams: {} })
  })

})
