'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

import ProjectFile from '../../models/files/ProjectFile';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('link command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

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
