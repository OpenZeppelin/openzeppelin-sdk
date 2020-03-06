'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';
import ProjectFile from '../../models/files/ProjectFile';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('unlink command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

  itShouldParse(
    'calls unlink script with a dependency name as parameter',
    'unlink',
    'oz unlink mock-stdlib@1.1.0 mock-stdlib-2@1.1.0',
    function(unlink) {
      const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.1.0'];
      unlink.should.have.been.calledWithExactly({ dependencies });
    },
  );

  itShouldParse(
    'should call push script when passing --push option',
    'push',
    'oz unlink mock-stdlib@1.1.0 --push test',
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
