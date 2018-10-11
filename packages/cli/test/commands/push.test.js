'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('push command', function() {

  stubCommands()

  itShouldParse('should call push script with options', 'push', 'zos push --network test --skip-compile -d --reset -f --full', function(push) {
    push.should.have.been.calledWithExactly({ force: true, deployLibs: true, reupload: true, full: true, network: 'test', txParams: {} })
  })

})
