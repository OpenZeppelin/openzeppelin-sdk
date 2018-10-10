'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('remove command', function() {

  stubCommands()

  itShouldParse('should call remove script', 'remove', 'zos remove Impl', function(remove) {
    remove.should.have.been.calledWithExactly({ contracts: ['Impl'] })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos remove Impl --push test', function(push) {
    push.should.have.been.calledWithExactly({ full: undefined, deployLibs: undefined, force: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
