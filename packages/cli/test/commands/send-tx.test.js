'use strict';
require('../setup');

import { stubCommands, itShouldParse } from './share';

describe('send-tx command', function() {
  stubCommands();

  itShouldParse(
    'should call send-tx script with mandatory options',
    'sendTx',
    'zos send-tx --to 0x42 --network test --method someMethod --args 42 --from 0x40',
    function(sendTx) {
      sendTx.should.have.been.calledWithExactly({
        proxyAddress: '0x42',
        methodName: 'someMethod',
        methodArgs: ['42'],
        network: 'test',
        txParams: { from: '0x40' },
      });
    },
  );

  itShouldParse(
    'should call send-tx script with non-mandatory options',
    'sendTx',
    'zos send-tx --to 0x42 --network test --method someMethod --args 42 --from 0x40 --value 1000 --gas 800000',
    function(sendTx) {
      sendTx.should.have.been.calledWithExactly({
        proxyAddress: '0x42',
        methodName: 'someMethod',
        methodArgs: ['42'],
        network: 'test',
        txParams: { from: '0x40' },
        gas: '800000',
        value: '1000',
      });
    },
  );
});
