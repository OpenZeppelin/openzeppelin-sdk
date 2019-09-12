'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('accounts command', function() {
  stubCommands();

  itShouldParse('should call accounts script', 'accounts', 'zos accounts --network local', function(accounts) {
    accounts.should.have.been.calledWithExactly({ network: 'local' });
  });
});
