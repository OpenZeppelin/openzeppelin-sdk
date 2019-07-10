'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('unpack command', function() {
  stubCommands();

  itShouldParse('should call unpack script with a name', 'unpack', 'zos unpack starter', function(unpack) {
    unpack.should.have.been.calledWithExactly({ repoOrName: 'starter' });
  });

  itShouldParse('should call unpack script with a github repo', 'unpack', 'zos unpack openzeppelin/starter', function(
    unpack,
  ) {
    unpack.should.have.been.calledWithExactly({
      repoOrName: 'openzeppelin/starter',
    });
  });
});
