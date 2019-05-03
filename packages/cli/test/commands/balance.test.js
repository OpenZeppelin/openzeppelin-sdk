'use strict'
require('../setup')

import { stubCommands, itShouldParse } from './share';

describe('balance command', function() {
  stubCommands()

  itShouldParse('should call balance script with account address', 'balance', 'zos balance 0x42 --network test', function(transfer) {
    transfer.should.have.been.calledWithExactly({ accountAddress: '0x42', contractAddress: undefined })
  });

  itShouldParse('should call balance script with account and contract address', 'balance', 'zos balance 0x42 --erc20 0x10 --network test', function(transfer) {
    transfer.should.have.been.calledWithExactly({ accountAddress: '0x42', contractAddress: '0x10' })
  });
})
