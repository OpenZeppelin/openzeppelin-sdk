'use strict'
require('../setup')

import {stubCommands, itShouldParse} from './share';

contract('create2 command', function() {

  stubCommands()

  itShouldParse('should call create2 script with options', 'create', 'zos create2 Impl --network test --init setup --args 42 --force --salt 10 --from 0x40 --signature 0x80', function(create) {
    create.should.have.been.calledWithExactly( { contractAlias: 'Impl', initMethod: 'setup', initArgs: ['42'], force: true, network: 'test', salt: "10", signature: '0x80', txParams: { from: '0x40'} })
  });

  itShouldParse('should call create2 script with query', 'queryDeployment', 'zos create2 --query 0x20 --network test --salt 10 --from 0x40', function(queryDeployment) {
    queryDeployment.should.have.been.calledWithExactly( { network: 'test', salt: "10", sender: "0x20", txParams: { from: '0x40'} })
  });

  itShouldParse('should call create2 script querying signature', 'querySignedDeployment', 'zos create2 Impl --query --init setup --args 42 --signature 0x80 --network test --salt 10 --from 0x40', function(querySignedDeployment) {
    querySignedDeployment.should.have.been.calledWithExactly( { network: 'test', contractAlias: 'Impl', salt: "10", signature: "0x80", initMethod: 'setup', initArgs: ['42'], txParams: { from: '0x40'} })
  });
})
