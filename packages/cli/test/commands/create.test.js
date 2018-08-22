'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('create command', function() {

  stubCommands()

  itShouldParse('should call create script with options', 'create', 'zos create Impl --network test --init initialize --args 42 --force --from 0x40', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', initMethod: 'initialize', initArgs: ['42'], force: true, network: 'test', txParams: { from: '0x40'} })
  })

  itShouldParse('should call create script with contract from package', 'create', 'zos create OpenZeppelin/Impl --network test', function(create) {
    create.should.have.been.calledWithExactly( { packageName: 'OpenZeppelin', contractAlias: 'Impl', network: 'test', txParams: {} })
  })

  itShouldParse('should call create script with contract from package with slashes', 'create', 'zos create Zeppelin/OpenZeppelin/Impl --network test', function(create) {
    create.should.have.been.calledWithExactly( { packageName: 'Zeppelin/OpenZeppelin', contractAlias: 'Impl', network: 'test', txParams: {} })
  })

})
