'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('update command', function() {

  stubCommands()

  itShouldParse('should call update script with options', 'update', 'zos update --network test --all --init initialize --args 42 --force --from 0x40', function(update) {
    update.should.have.been.calledWith( { initMethod: 'initialize', initArgs: ['42'], all: true, force: true, network: 'test', txParams: { from: '0x40' } } )
  })

  itShouldParse('should call update script with contract name', 'update', 'zos update Impl --network test', function(update) {
    update.should.have.been.calledWith( { contractAlias: 'Impl', network: 'test', txParams: {} } )
  })

  itShouldParse('should call update script with contract and package name', 'update', 'zos update OpenZeppelin/Impl --network test', function(update) {
    update.should.have.been.calledWith( { packageName: 'OpenZeppelin', contractAlias: 'Impl', network: 'test', txParams: {} } )
  })

  itShouldParse('should call update script with package name only', 'update', 'zos update OpenZeppelin/ --network test', function(update) {
    update.should.have.been.calledWith( { packageName: 'OpenZeppelin', network: 'test', txParams: {} } )
  })

  itShouldParse('should call update script with address', 'update', 'zos update 0x80 --network test', function(update) {
    update.should.have.been.calledWith( { proxyAddress: '0x80', network: 'test', txParams: {} } )
  })

})
