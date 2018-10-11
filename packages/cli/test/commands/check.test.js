'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('check command', function() {

  stubCommands()

  itShouldParse('should call check script with an alias', 'check', 'zos check Impl --skip-compile', function(check) {
    check.should.have.been.calledWithExactly({ contractAlias: 'Impl' })
  })
  
  itShouldParse('should call check script for all contracts', 'check', 'zos check --skip-compile', function(check) {
    check.should.have.been.calledWithExactly({ contractAlias: undefined })
  })
  
})
