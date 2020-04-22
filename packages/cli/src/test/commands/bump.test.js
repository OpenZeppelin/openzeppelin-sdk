'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';
import ProjectFile from '../../models/files/ProjectFile';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('bump command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

  itShouldParse('should call bump script with version', 'bump', 'oz bump 0.2.0 ', function(bump) {
    bump.should.have.been.calledWithExactly({ version: '0.2.0' });
  });

  itShouldParse('should call push script when passing --push option', 'push', 'oz bump 0.2.0 --push test', function(
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
