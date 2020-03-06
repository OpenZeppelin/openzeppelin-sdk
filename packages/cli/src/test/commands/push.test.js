'use strict';
require('../setup');

import { ZWeb3 } from '@openzeppelin/upgrades';
import sinon from 'sinon';
import { stubCommands, itShouldParse } from './share';

import ProjectFile from '../../models/files/ProjectFile';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('push command', function() {
  stubCommands();

  beforeEach('stub ProjectFile#contracts', function() {
    sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Bar', 'Foo']);
  });

  afterEach('restore stubs', function() {
    sandbox.restore();
  });

  context('when network uses ganache', function() {
    itShouldParse(
      'should call push script with options',
      'push',
      'oz push --network test --skip-compile -d --reset --force --deploy-proxy-admin --deploy-proxy-factory',
      function(push) {
        push.should.have.been.calledWithExactly({
          contracts: ['Bar', 'Foo'],
          force: true,
          deployDependencies: true,
          deployProxyAdmin: true,
          deployProxyFactory: true,
          reupload: true,
          network: 'test',
          txParams: {},
        });
      },
    );
  });

  context('when network does not use ganache', function() {
    before('stub ZWeb3#isGanacheNode', function() {
      sinon.stub(ZWeb3, 'isGanacheNode').returns(false);
    });

    after('restore stub', function() {
      sinon.restore();
    });

    itShouldParse(
      'should call push script with options',
      'push',
      'oz push --network test --skip-compile -d --reset --force --deploy-proxy-admin --deploy-proxy-factory',
      function(push) {
        push.should.have.been.calledWithExactly({
          contracts: ['Bar', 'Foo'],
          force: true,
          deployProxyAdmin: true,
          deployProxyFactory: true,
          deployDependencies: undefined,
          reupload: true,
          network: 'test',
          txParams: {},
        });
      },
    );
  });
});
