'use strict';
require('../setup');

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

import { stubCommands, itShouldParse } from './share';
import ProjectFile from '../../models/files/ProjectFile';

describe('add command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

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
        contracts: ['Bar', 'Foo'],
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
