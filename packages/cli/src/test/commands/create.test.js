'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';
import { ProxyType } from '../../scripts/interfaces';

describe('create command', function() {
  stubCommands();

  itShouldParse(
    'should call create script with options',
    'create',
    'oz create Impl --network test --init setup --args 42 --force --from 0x40',
    function(create) {
      create.should.have.been.calledWithExactly({
        contractName: 'Impl',
        methodName: 'setup',
        methodArgs: ['42'],
        force: true,
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call create script with kind',
    'create',
    'oz create Impl --network test --init setup --args 42 --force --from 0x40 --minimal',
    function(create) {
      create.should.have.been.calledWithExactly({
        contractName: 'Impl',
        methodName: 'setup',
        methodArgs: ['42'],
        kind: ProxyType.Minimal,
        force: true,
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call create script with options',
    'create',
    'oz create Boolean --network test --init initialize --args false --force --from 0x40',
    function(create) {
      create.should.have.been.calledWithExactly({
        contractName: 'Boolean',
        methodName: 'initialize',
        methodArgs: [false],
        force: true,
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call create script with default init method',
    'create',
    'oz create Impl --network test --init --args 42 --force --from 0x40',
    function(create) {
      create.should.have.been.calledWithExactly({
        contractName: 'Impl',
        methodName: 'initialize',
        methodArgs: ['42'],
        force: true,
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call create script with init if only args is provided',
    'create',
    'oz create Impl --network test --args 42 --force --from 0x40',
    function(create) {
      create.should.have.been.calledWithExactly({
        contractName: 'Impl',
        methodName: 'initialize',
        methodArgs: ['42'],
        force: true,
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call create script with contract from package',
    'create',
    'oz create OpenZeppelin/Impl --network test',
    function(create) {
      create.should.have.been.calledWithExactly({
        packageName: 'OpenZeppelin',
        contractName: 'Impl',
        network: 'test',
        txParams: {},
        methodArgs: [],
      });
    },
  );

  itShouldParse(
    'should call create script with contract from package with slashes',
    'create',
    'oz create Zeppelin/OpenZeppelin/Impl --network test',
    function(create) {
      create.should.have.been.calledWithExactly({
        packageName: 'Zeppelin/OpenZeppelin',
        contractName: 'Impl',
        network: 'test',
        txParams: {},
        methodArgs: [],
      });
    },
  );
});
