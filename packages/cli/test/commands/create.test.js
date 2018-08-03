'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('create command', function() {

  stubCommands()

  itShouldParse('should call create script with options', 'create', 'zos create Impl --network test --init initialize --args 42 --force', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', initMethod: 'initialize', initArgs: ['42'], force: true, network: 'test', txParams: {} })
  })

})
