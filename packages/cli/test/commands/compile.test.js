'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('compile command', function() {
  stubCommands()

  itShouldParse('should call compile', 'compiler', 'zos compile', function(compiler) {
    compiler.should.have.been.calledOnce;
  })
  
})
