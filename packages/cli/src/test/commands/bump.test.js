'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('bump command', function() {
  stubCommands();

  itShouldParse('should call bump script with version', 'bump', 'zos bump 0.2.0 ', function(bump) {
    bump.should.have.been.calledWithExactly({ version: '0.2.0' });
  });

  itShouldParse('should call push script when passing --push option', 'push', 'zos bump 0.2.0 --push test', function(
    push,
  ) {
    push.should.have.been.calledWithExactly({
      deployProxyAdmin: undefined,
      deployProxyFactory: undefined,
      deployDependencies: true,
      force: undefined,
      reupload: undefined,
      network: 'test',
      txParams: {},
    });
  });
});
