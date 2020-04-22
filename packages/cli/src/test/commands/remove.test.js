'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';
import ProjectFile from '../../models/files/ProjectFile';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('remove command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

  itShouldParse('should call remove script', 'remove', 'zos remove Impl', function(remove) {
    remove.should.have.been.calledWithExactly({ contracts: ['Impl'] });
  });

  itShouldParse('should call push script when passing --push option', 'push', 'zos remove Impl --push test', function(
    push,
  ) {
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
  });
});
