'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('check command', function() {
  stubCommands();

  itShouldParse('should call check script with an contract name', 'check', 'oz check Impl --skip-compile', function(
    check,
  ) {
    check.should.have.been.calledWithExactly({ contractName: 'Impl' });
  });

  itShouldParse('should call check script for all contracts', 'check', 'oz check --skip-compile', function(check) {
    check.should.have.been.calledWithExactly({ contractName: undefined });
  });
});
