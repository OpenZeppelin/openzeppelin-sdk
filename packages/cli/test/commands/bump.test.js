'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('bump command', function() {

  stubCommands()

  itShouldParse('should call bump script with version', 'bump', 'zos bump 0.2.0 ', function(bump) {
    bump.should.have.been.calledWithExactly({ version: '0.2.0' })
  })

  itShouldParse('should call push script when passing --push option', 'push', 'zos bump 0.2.0 --push test', function(push) {
    push.should.have.been.calledWithExactly({  deployDependencies: undefined, force: undefined, reupload: undefined, network: 'test', txParams: {} })
  })

})
