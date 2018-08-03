'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('update command', function() {

  stubCommands()

  itShouldParse('should call update script with version, stdlib version and no install', 'update', 'zos update Impl --network test --all --init initialize --args 42 --force', function(update) {
    update.should.have.been.calledWithExactly( { contractAlias: 'Impl', proxyAddress: undefined, initMethod: 'initialize', initArgs: ['42'], all: true, force: true, network: 'test', txParams: {} } )
  })

})
