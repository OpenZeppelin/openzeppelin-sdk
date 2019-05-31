'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('unlink command', function() {
  stubCommands();

  itShouldParse(
    'calls unlink script with a dependency name as parameter',
    'unlink',
    'zos unlink mock-stdlib@1.1.0 mock-stdlib2@1.1.0',
    function(unlink) {
      const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib2@1.1.0'];
      unlink.should.have.been.calledWithExactly({ dependencies });
    },
  );

  itShouldParse(
    'should call push script when passing --push option',
    'push',
    'zos unlink mock-stdlib@1.1.0 --push test',
    function(push) {
      push.should.have.been.calledWithExactly({
        deployProxyAdmin: undefined,
        deployProxyFactory: undefined,
        deployDependencies: true,
        force: undefined,
        reupload: undefined,
        network: 'test',
        txParams: {},
      });
    },
  );
});
