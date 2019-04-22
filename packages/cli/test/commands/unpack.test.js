'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('unpack command', function() {
  stubCommands()

  itShouldParse('should call unpack script with a name', 'unpack', 'zos unpack ZepKit', function(unpack) {
    unpack.should.have.been.calledWithExactly( { repoOrName: 'ZepKit' });
  })

  itShouldParse('should call unpack script with a github repo', 'unpack', 'zos unpack zeppelinos/zepkit', function(unpack) {
    unpack.should.have.been.calledWithExactly( { repoOrName: 'zeppelinos/zepkit' });
  })

})
