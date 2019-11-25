'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('init command', function() {
  stubCommands();

  itShouldParse(
    'should call init script with name, version and dependencies',
    'init',
    'zos init MyApp 0.2.0 --force --no-install --link mock-stdlib@1.1.0,mock-stdlib-2@1.2.0 --no-interactive',
    function(init) {
      const dependencies = ['mock-stdlib@1.1.0', 'mock-stdlib-2@1.2.0'];
      init.should.have.been.calledWithExactly({
        name: 'MyApp',
        version: '0.2.0',
        dependencies,
        installDependencies: false,
        force: true,
        publish: undefined,
        typechainEnabled: undefined,
        typechainOutdir: undefined,
        typechainTarget: undefined,
      });
    },
  );

  itShouldParse(
    'should call push script when passing --push option',
    'push',
    'zos init MyApp 0.2.0 --push test --no-interactive',
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

  itShouldParse(
    'should call init script with light flag',
    'init',
    'zos init MyApp 0.2.0 --publish --no-interactive',
    function(init) {
      init.should.have.been.calledWithExactly({
        name: 'MyApp',
        version: '0.2.0',
        publish: true,
        force: undefined,
        installDependencies: undefined,
        dependencies: [],
        typechainEnabled: undefined,
        typechainOutdir: undefined,
        typechainTarget: undefined,
      });
    },
  );

  itShouldParse(
    'should call init script with typechain',
    'init',
    'zos init MyApp 0.2.0 --typechain=web3-v1 --typechain-outdir=foo/bar --no-interactive',
    function(init) {
      init.should.have.been.calledWithExactly({
        name: 'MyApp',
        version: '0.2.0',
        publish: undefined,
        force: undefined,
        installDependencies: undefined,
        dependencies: [],
        typechainEnabled: true,
        typechainOutdir: 'foo/bar',
        typechainTarget: 'web3-v1',
      });
    },
  );
});
