'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('status command', function() {

  stubCommands()

  itShouldParse('should call status script', 'status', 'zos status --network test', function(status) {
    status.should.have.been.calledWithExactly({ network: 'test', txParams: {} })
  })

  itShouldParse('should call pull script when passing --fix option', 'pull', 'zos status --network test --fix', function(pull) {
    pull.should.have.been.calledWithExactly({ network: 'test', txParams: {} })
  })

  itShouldParse('should call compare script when passing --fetch option', 'compare', 'zos status --network test --fetch', function(compare) {
    compare.should.have.been.calledWithExactly({ network: 'test', txParams: {} })
  })

})
