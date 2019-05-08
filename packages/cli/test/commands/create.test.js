'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('create command', function() {
  stubCommands()

  itShouldParse('should call create script with options', 'create', 'zos create Impl --network test --init setup --args 42 --force --from 0x40', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', methodName: 'setup', methodArgs: ['42'], force: true, network: 'test', txParams: { from: '0x40'} })
  })

  itShouldParse('should call create script with options', 'create', 'zos create Boolean --network test --init initialize --args false --force --from 0x40', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Boolean', methodName: 'initialize', methodArgs: [false], force: true, network: 'test', txParams: { from: '0x40'} })
  })

  itShouldParse('should call create script with default init method', 'create', 'zos create Impl --network test --init --args 42 --force --from 0x40', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', methodName: 'initialize', methodArgs: ['42'], force: true, network: 'test', txParams: { from: '0x40'} })
  })

  itShouldParse('should call create script with init if only args is provided', 'create', 'zos create Impl --network test --args 42 --force --from 0x40', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', methodName: 'initialize', methodArgs: ['42'], force: true, network: 'test', txParams: { from: '0x40'} })
  })

  itShouldParse('should call create script with contract from package', 'create', 'zos create OpenZeppelin/Impl --network test', function(create) {
    create.should.have.been.calledWithExactly( { packageName: 'OpenZeppelin', contractAlias: 'Impl', network: 'test', txParams: {}, methodArgs: [] })
  })

  itShouldParse('should call create script with contract from package with slashes', 'create', 'zos create Zeppelin/OpenZeppelin/Impl --network test', function(create) {
    create.should.have.been.calledWithExactly( { packageName: 'Zeppelin/OpenZeppelin', contractAlias: 'Impl', network: 'test', txParams: {}, methodArgs: [] })
  })
})
