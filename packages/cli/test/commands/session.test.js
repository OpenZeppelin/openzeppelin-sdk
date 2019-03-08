'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('session command', function() {
  stubCommands()

  itShouldParse('should call session script with --expires option', 'session', 'zos session --network test --expires 3600', function(session) {
    session.should.have.been.calledWithExactly({ close: undefined, expires: '3600', from: undefined, network: 'test', timeout: undefined })
  })

  itShouldParse('should call session script with --close option', 'session', 'zos session --network test --close', function(session) {
    session.should.have.been.calledWithExactly({ close: true, expires: undefined, from: undefined, network: 'test', timeout: undefined })
  })

})
