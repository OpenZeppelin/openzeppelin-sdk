'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('call command', function() {
  stubCommands();

  itShouldParse(
    'should call call script with mandatory options',
    'call',
    'zos call --to 0x42 --network test --method someMethod --args 42 --from 0x40',
    function(call) {
      call.should.have.been.calledWithExactly({
        proxyAddress: '0x42',
        methodName: 'someMethod',
        methodArgs: ['42'],
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );
});
