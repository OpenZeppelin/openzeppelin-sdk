'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('add command', function() {
  stubCommands();

  itShouldParse('should call add script with a command and a filename', 'add', 'oz add ImplV1 --skip-compile', function(
    add,
  ) {
    add.should.have.been.calledWithExactly({
      contracts: ['ImplV1'],
    });
  });

  itShouldParse(
    'should call add-all script when passing --all option',
    'addAll',
    'oz add --all --skip-compile',
    function(addAll) {
      addAll.should.have.been.calledWithExactly({});
    },
  );

  itShouldParse(
    'should call push script when passing --push option',
    'push',
    'oz add --all --push test --skip-compile',
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
