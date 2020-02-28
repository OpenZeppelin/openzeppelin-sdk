'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('link command', function() {
  stubCommands();

  itShouldParse(
    'should call link script with a list of dependencies and no install',
    'link',
    'openzeppelin link mock-stdlib@1.1.0 mock-stdlib-2@1.2.0 --no-install --no-interactive',
    function(link) {
      const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0'];
      link.should.have.been.calledWithExactly({
        dependencies,
        installDependencies: undefined,
      });
    },
  );

  itShouldParse(
    'should call push script when passing --push option',
    'push',
    'openzeppelin link mock-stdlib@1.1.0 mock-stdlib-2@1.2.0 --push test',
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
